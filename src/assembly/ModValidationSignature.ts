import { System, Storage, authority, Protobuf, value } from "@koinos/sdk-as";
import { modvalidation, ModValidation, MODULE_VALIDATION_TYPE_ID } from "@veive/mod-validation-as";
import { modvalidationsignature } from "./proto/modvalidationsignature";
import { IAccount, account } from "@veive/account-as";

const THRESHOLD_SPACE_ID = 1;
const ACCOUNT_SPACE_ID = 2;
const DEFAULT_THRESHOLD : u32 = 1;
export class ModValidationSignature extends ModValidation {
  callArgs: System.getArgumentsReturn | null;

  contractId: Uint8Array = System.getContractId();

  account_id: Storage.Obj<modvalidationsignature.account_id> =
    new Storage.Obj(
      this.contractId,
      ACCOUNT_SPACE_ID,
      modvalidationsignature.account_id.decode,
      modvalidationsignature.account_id.encode,
      () => new modvalidationsignature.account_id()
    );

  threshold: Storage.Obj<modvalidationsignature.threshold> =
    new Storage.Obj(
      this.contractId,
      THRESHOLD_SPACE_ID,
      modvalidationsignature.threshold.decode,
      modvalidationsignature.threshold.encode,
      () => new modvalidationsignature.threshold()
    );

  /**
   * Validate operation by checking allowance
   * @external
   */
  is_valid_operation(args: modvalidation.is_valid_operation_args): modvalidation.is_valid_operation_result {
    System.log(`[mod-validation-signature] is_valid_operation called`);

    const result = new modvalidation.is_valid_operation_result(true);
    let valid_signatures: u32 = 0;

    const i_account = new IAccount(this.account_id.get()!.value!);
    const sig_bytes = System.getTransactionField("signatures")!.message_value!.value!;
    const signatures = Protobuf.decode<value.list_type>(sig_bytes, value.list_type.decode).values;
    const tx_id = System.getTransactionField("id")!.bytes_value;

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i].bytes_value;
      const valid = i_account.is_valid_signature(new account.is_valid_signature_args(
        this.account_id.get()!.value!,
        signature,
        tx_id
      ));

      if (valid.value == true) {
        valid_signatures = valid_signatures + 1;
      }
    }

    const threshold = this.threshold.get()!.value;
    if (
      (threshold == 0 && valid_signatures != signatures.length) ||
      (threshold > 0 && valid_signatures < threshold)
    ) {
      result.value = false;
      System.log(`[mod-validation-signature] check signature failed`);
    } else {
      System.log(`[mod-validation-signature] check signature succeeded`);
    }


    return result;
  }

  /**
   * @external
   */
  set_threshold(args: modvalidationsignature.set_threshold): void {
    const is_authorized = System.checkAuthority(authority.authorization_type.contract_call, this._get_account_id());
    System.require(is_authorized, `not authorized by the account`);

    const threshold = this.threshold.get()! || new modvalidationsignature.threshold();
    threshold.value = args.value;
    this.threshold.put(threshold);
  }

  /**
   * @external
   * @readonly 
   */
  get_threshold(): modvalidationsignature.get_threshold {
    const result = new modvalidationsignature.get_threshold();
    result.value = this.threshold.get()!.value;
    return result;
  }

  /**
   * @external
   */
  on_install(args: modvalidation.on_install_args): void {
    const account = new modvalidationsignature.account_id();
    account.value = System.getCaller().caller;
    this.account_id.put(account);

    const threshold = new modvalidationsignature.threshold(DEFAULT_THRESHOLD);
    this.threshold.put(threshold);

    System.log('[mod-validation-signature] called on_install');
  }

  /**
   * @external
   * @readonly
   */
  manifest(): modvalidation.manifest {
    const result = new modvalidation.manifest();
    result.name = "Signature validator";
    result.description = "Module to validate transaction signature";
    result.type_id = MODULE_VALIDATION_TYPE_ID;
    return result;
  }

  /**
   * Get associated account_id
   * 
   * @external
   * @readonly
   */
  get_account_id(): modvalidationsignature.account_id {
    return this.account_id.get()!;
  }

  /**
   * return account id
   */
  _get_account_id(): Uint8Array {
    return this.account_id.get()!.value!;
  }
}
