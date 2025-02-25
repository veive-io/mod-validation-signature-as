import { LocalKoinos } from "@roamin/local-koinos";
import { Contract, Provider, Signer, Transaction, utils } from "koilib";
import path from "path";
import { randomBytes } from "crypto";
import { beforeAll, afterAll, it, expect } from "@jest/globals";
import * as modAbi from "../build/modvalidationsignature-abi.json";
import * as modSignMnemonicAbi from "../node_modules/@veive-io/mod-sign-mnemonic-as/dist/modsignmnemonic-abi.json";
import * as modSignWebauthnAbi from "../node_modules/@veive-io/mod-sign-webauthn-as/dist/modsignwebauthn-abi.json";
import * as accountAbi from "@veive-io/account-as/dist/account-abi.json";
import * as dotenv from "dotenv";

dotenv.config();

jest.setTimeout(600000);

const TEST_ENTRY_POINT = 2676412545;

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

const modMnemonicSign = new Signer({
  privateKey: randomBytes(32).toString("hex"),
  provider,
});

const modWebauthnSign = new Signer({
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

const mod = new Contract({
  id: modSign.getAddress(),
  abi: modAbi,
  provider,
});
const modContract = mod.functions;
const modSerializer = mod.serializer;

beforeAll(async () => {
  // start local-koinos node
  await localKoinos.startNode();
  await localKoinos.startBlockProduction();

  // deploy smart-account
  await localKoinos.deployContract(
    accountSign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive-io/account-as/dist/release/Account.wasm"),
    accountAbi,
    {},
    {
      authorizesCallContract: true,
      authorizesTransactionApplication: true,
      authorizesUploadContract: true,
    }
  );

  // deploy mod contract
  await localKoinos.deployContract(
    modSign.getPrivateKey("wif"),
    path.join(__dirname, "../build/release/ModValidationSignature.wasm"),
    modAbi
  );

  // deploy mod sign mnemonic contract
  await localKoinos.deployContract(
    modMnemonicSign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive-io/mod-sign-mnemonic-as/dist/release/ModSignMnemonic.wasm"),
    modSignMnemonicAbi
  );

  // deploy mod sign webauthn contract
  await localKoinos.deployContract(
    modWebauthnSign.getPrivateKey("wif"),
    path.join(__dirname, "../node_modules/@veive-io/mod-sign-webauthn-as/dist/release/ModSignWebauthn.wasm"),
    modSignWebauthnAbi
  );

  // install mod sign mnemonic
  const { operation: install_module_mnemonic } = await accountContract["install_module"]({
    module_type_id: 3,
    contract_id: modMnemonicSign.address
  }, { onlyOperation: true });

  // install mod sign webauthn
  const { operation: install_module_webauthn } = await accountContract["install_module"]({
    module_type_id: 3,
    contract_id: modWebauthnSign.address
  }, { onlyOperation: true });

  const tx = new Transaction({
    signer: accountSign,
    provider
  });

  const { operation: exec1 } = await accountContract["execute_user"]({
    operation: {
      contract_id: install_module_mnemonic.call_contract.contract_id,
      entry_point: install_module_mnemonic.call_contract.entry_point,
      args: install_module_mnemonic.call_contract.args
    }
  }, { onlyOperation: true });

  const { operation: exec2 } = await accountContract["execute_user"]({
    operation: {
      contract_id: install_module_webauthn.call_contract.contract_id,
      entry_point: install_module_webauthn.call_contract.entry_point,
      args: install_module_webauthn.call_contract.args
    }
  }, { onlyOperation: true });

  await tx.pushOperation(exec1);
  await tx.pushOperation(exec2);
  await tx.send();
  await tx.wait();
});

afterAll(() => {
  // stop local-koinos node
  localKoinos.stopNode();
});

it("install module in scopes: contract_upload, transaction_application, contract_call+entry_point=test", async () => {
  const scope1 = await modSerializer.serialize({operation_type: 'contract_call', entry_point: TEST_ENTRY_POINT}, "scope");
  const scope2 = await modSerializer.serialize({operation_type: 'contract_upload'}, "scope");
  const scope3 = await modSerializer.serialize({operation_type: 'transaction_application'}, "scope");

  // install validator
  const { operation: install_module } = await accountContract["install_module"]({
    module_type_id: 1,
    contract_id: modSign.address,
    scopes: [
      utils.encodeBase64url(scope1),
      utils.encodeBase64url(scope2),
      utils.encodeBase64url(scope3)
    ]
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

  const { result: r2 } = await modContract["get_threshold"]({
    user: accountSign.address
  });
  expect(r2.value).toStrictEqual(1);
});

it("account test operation mnemonic signed", async () => {
  // prepare operation
  const { operation: test } = await accountContract["test"]({}, { onlyOperation: true });

  // prepare execute
  const { operation: exec } = await accountContract["execute_user"]({
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

  console.log(receipt);

  expect(receipt.logs).toContain("[mod-validation-signature] is_authorized called");
  expect(receipt.logs).toContain("[mod-validation-signature] check signature succeeded");
  expect(receipt.logs).toContain(`[account] selected scope contract_call + ${test.call_contract.entry_point}`);
});


it("account test operation WRONG mnemonic signed", async () => {
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