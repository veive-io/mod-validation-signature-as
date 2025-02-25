import { System, Storage, authority, Protobuf, value } from "@koinos/sdk-as";
import { modvalidation, ModValidation, MODULE_VALIDATION_TYPE_ID } from "@veive-io/mod-validation-as";
import { modvalidationsignature } from "./proto/modvalidationsignature";
import { IAccount, account } from "@veive-io/account-as";

const DEFAULT_THRESHOLD : u32 = 1;
const ALLOW_ENTRY_POINT = 1090552691;
const SPACE_ID = 1;
export class ModValidationSignature extends ModValidation {
  callArgs: System.getArgumentsReturn | null;

  contract_id: Uint8Array = System.getContractId();
  
  threshold_storage: Storage.Map<Uint8Array, modvalidationsignature.threshold> = new Storage.Map(
    this.contract_id,
    SPACE_ID,
    modvalidationsignature.threshold.decode,
    modvalidationsignature.threshold.encode,
    () => new modvalidationsignature.threshold()
  );

  /**
   * Validate operation by checking allowance
   * @external
   */
  is_authorized(args: modvalidation.authorize_arguments): modvalidation.authorize_result {
    const user = System.getCaller().caller;

    System.log(`[mod-validation-signature] is_authorized called`);

    const result = new modvalidation.authorize_result(true);
    let valid_signatures: u32 = 0;

    const i_account = new IAccount(user);
    const sig_bytes = System.getTransactionField("signatures")!.message_value!.value!;
    const signatures = Protobuf.decode<value.list_type>(sig_bytes, value.list_type.decode).values;
    const tx_id = System.getTransactionField("id")!.bytes_value;

    for (let i = 0; i < signatures.length; i++) {
      const signature = signatures[i].bytes_value;
      const valid = i_account.is_valid_signature(new account.is_valid_signature_args(
        user,
        signature,
        tx_id
      ));

      if (valid.value == true) {
        valid_signatures = valid_signatures + 1;
      }
    }

    const threshold = this.threshold_storage.get(user)!.value;
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
  set_threshold(args: modvalidationsignature.set_threshold_args): void {
    const is_authorized = System.checkAuthority(authority.authorization_type.contract_call, args.user!);
    System.require(is_authorized, `not authorized by the account`);

    const threshold = new modvalidationsignature.threshold(args.value);
    this.threshold_storage.put(args.user!, threshold);
  }

  /**
   * @external
   * @readonly 
   */
  get_threshold(args: modvalidationsignature.get_threshold_args): modvalidationsignature.get_threshold_result {
    const result = new modvalidationsignature.get_threshold_result();
    result.value = this.threshold_storage.get(args.user!)!.value;
    return result;
  }

  /**
   * @external
   */
  on_install(args: modvalidation.on_install_args): void {
    const user = System.getCaller().caller;
    const threshold = new modvalidationsignature.threshold(DEFAULT_THRESHOLD);
    this.threshold_storage.put(user, threshold);

    System.log('[mod-validation-signature] called on_install');
  }

  /**
   * @external
   * @readonly
   */
  manifest(): modvalidation.manifest {
    const result = new modvalidation.manifest();
    result.name = "Validation Signature";
    result.description = "Validate a transaction with a signature";
    result.type_id = MODULE_VALIDATION_TYPE_ID;
    result.version = "2.0.0";
    result.scopes = [
      new modvalidation.scope('contract_upload'),
      new modvalidation.scope('transaction_application'),
      new modvalidation.scope('contract_call', ALLOW_ENTRY_POINT)
    ];
    return result;
  }
}
