import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Provider, Signer, Transaction } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as modAbi from "../build/modvalidationsignature-abi.json";
import * as modSignEcdsaAbi from "../node_modules/@veive/mod-sign-ecdsa-as/dist/modsignecdsa-abi.json";
import * as accountAbi from "@veive/account-as/dist/account-abi.json";
import * as dotenv from "dotenv";

dotenv.config();

jest.setTimeout(600000);

const localKoinos = new LocalKoinos();
const provider = localKoinos.getProvider() as unknown as Provider;

const accountSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const modSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const modEcdsaSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const wrongSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const accountContract = new Contract({
  id: accountSign.getAddress(),
  abi: accountAbi,
  provider,
}).functions;

const modContract = new Contract({
  id: modSign.getAddress(),
  abi: modAbi,
  provider,
}).functions;

beforeAll(async () => {
  // start local-koinos node
  await localKoinos.startNode();
  await localKoinos.startBlockProduction();

  // deploy smart-account
  await localKoinos.deployContract(
    accountSign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive/account-as/dist/release/Account.wasm"),
    accountAbi,
    {},
    {
      authorizesCallContract: true,
      authorizesTransactionApplication: false,
      authorizesUploadContract: false,
    }
  );

  // deploy mod contract
  await localKoinos.deployContract(
    modSign.getPrivateKey("wif"),
    path.join(__dirname, "../build/release/ModValidationSignature.wasm"),
    modAbi
  );

  // deploy mod sign ecdsa contract
  await localKoinos.deployContract(
    modEcdsaSign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive/mod-sign-ecdsa-as/dist/release/ModSignEcdsa.wasm"),
    modSignEcdsaAbi
  );

  // install mod sign ecdsa
  const { operation: install_module } = await accountContract["install_module"]({
    module_type_id: 3,
    contract_id: modEcdsaSign.address
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: accountSign,
    provider
  });

  const { operation: exec } = await accountContract["execute_user"]({
    operation: {
      contract_id: install_module.call_contract.contract_id,
      entry_point: install_module.call_contract.entry_point,
      args: install_module.call_contract.args
    }
  }, { onlyOperation: true });

  await tx.pushOperation(exec);
  await tx.send();
  await tx.wait();
});

afterAll(() => {
  // stop local-koinos node
  localKoinos.stopNode();
});

it("install module", async () => {
  // install validator
  const { operation: install_module } = await accountContract["install_module"]({
    module_type_id: 1,
    contract_id: modSign.address
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: accountSign,
    provider
  });

  const { operation: exec } = await accountContract["execute_user"]({
    operation: {
      contract_id: install_module.call_contract.contract_id,
      entry_point: install_module.call_contract.entry_point,
      args: install_module.call_contract.args
    }
  }, { onlyOperation: true });

  await tx.pushOperation(exec);
  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();
  expect(receipt.logs).toContain("[mod-validation-signature] called on_install");

  const { result: r1 } = await accountContract["get_modules"]();
  expect(r1.value).toContain(modSign.address);

  const { result: r2 } = await modContract["get_threshold"]();
  expect(r2.value).toStrictEqual(1);
});

it("account add 'test' to only entry point list", async () => {
  // prepare operation
  const { operation: test } = await accountContract['test']({}, { onlyOperation: true });

  // add 'test' to only entry points
  const { operation: add_only_entry_point } = await modContract['add_only_entry_point']({
    entry_point: test.call_contract.entry_point
  }, { onlyOperation: true });

  // send operations
  const tx = new Transaction({
    signer: accountSign,
    provider
  });
  await tx.pushOperation(add_only_entry_point);

  const receipt = await tx.send();
  await tx.wait();

  expect(receipt).toBeDefined();

  const { result } = await modContract['get_only_entry_points']();
  expect(result.value).toContain(test.call_contract.entry_point);
});


it("account test operation ECDSA signed", async () => {
  // prepare operation
  const { operation: test } = await accountContract["test"]({}, { onlyOperation: true });

  // prepare execute
  const { operation: exec } = await accountContract["execute"]({
    operation: {
      contract_id: test.call_contract.contract_id,
      entry_point: test.call_contract.entry_point
    }
  }, { onlyOperation: true });

  // send operations
  const tx = new Transaction({
    signer: accountSign,
    provider
  });

  await tx.pushOperation(exec);

  const receipt = await tx.send();
  await tx.wait();

  expect(receipt.logs).toContain("[mod-validation-signature] is_valid_operation called");
  expect(receipt.logs).toContain("[mod-validation-signature] check signature succeeded");
});

it("account test operation WRONG ECDSA signed", async () => {
  // prepare operation
  const { operation: test } = await accountContract["test"]({}, { onlyOperation: true });

  // prepare execute
  const { operation: exec } = await accountContract["execute"]({
    operation: {
      contract_id: test.call_contract.contract_id,
      entry_point: test.call_contract.entry_point
    }
  }, { onlyOperation: true });

  // send operations
  const tx = new Transaction({
    signer: wrongSign,
    provider
  });

  await tx.pushOperation(exec);

  let error = undefined;
  try {
    await tx.send();
    await tx.wait();
  } catch (e) {
    error = JSON.parse(e.message);
  }

  // expect fail check
  expect(error.logs).toContain(`[mod-validation-signature] check signature failed`);
});