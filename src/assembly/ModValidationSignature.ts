import { System, Storage, authority, Protobuf, value } from "@koinos/sdk-as";
import { modvalidation, ModValidation, MODULE_VALIDATION_TYPE_ID } from "@veive/mod-validation-as";
import { modvalidationsignature } from "./proto/modvalidationsignature";
import { IAccount, account } from "@veive/account-as";

const CONFIG_SPACE_ID = 1;
const ACCOUNT_SPACE_ID = 2;
const DEFAULT_CONFIG_THRESHOLD : u32 = 1;
const DEFAULT_ONLY_ENTRY_POINTS : u32[] = [
  1090552691 // "allow"
];

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

  config_storage: Storage.Obj<modvalidationsignature.config_storage> =
    new Storage.Obj(
      this.contractId,
      CONFIG_SPACE_ID,
      modvalidationsignature.config_storage.decode,
      modvalidationsignature.config_storage.encode,
      () => new modvalidationsignature.config_storage()
    );

  /**
   * Validate operation by checking allowance
   * @external
   */
  is_valid_operation(args: modvalidation.is_valid_operation_args): modvalidation.is_valid_operation_result {
    System.log(`[mod-validation-signature] is_valid_operation called`);

    const result = new modvalidation.is_valid_operation_result(true);
    let valid_signatures: u32 = 0;

    if (
      this.config_storage &&
      this.config_storage.get() &&
      this.config_storage.get()!.only_entry_points &&
      (
        this.config_storage.get()!.only_entry_points.length == 0 ||
        this.config_storage.get()!.only_entry_points.includes(args.operation!.entry_point)
      )
    ) {
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

      const threshold = this.config_storage.get()!.threshold;
      if (
        (threshold == 0 && valid_signatures != signatures.length) ||
        (threshold > 0 && valid_signatures < threshold)
      ) {
        result.value = false;
        System.log(`[mod-validation-signature] check signature failed`);
      } else {
        System.log(`[mod-validation-signature] check signature succeeded`);
      }
      
    } else {
      System.log(`[mod-validation-signature] check signature skipped`);
    }

    return result;
  }

  /**
   * Adds an antry point to skip list
   * @external
   */
  add_only_entry_point(args: modvalidationsignature.add_only_entry_point_args): void {
    const is_authorized = System.checkAuthority(authority.authorization_type.contract_call, this._get_account_id());
    System.require(is_authorized, `not authorized by the account`);

    const config = this.config_storage.get()!;

    // Check for duplicates
    for (let i = 0; i < config.only_entry_points.length; i++) {
      if (config.only_entry_points[i] == args.entry_point) {
        System.log("Entry point already exists");
        return;
      }
    }

    // Add new entry
    config.only_entry_points.push(args.entry_point);
    this.config_storage.put(config);
  }

  /**
   * Removes an antry point from skips
   * @external
   */
  remove_only_entry_point(args: modvalidationsignature.remove_only_entry_point_args): void {
    const is_authorized = System.checkAuthority(authority.authorization_type.contract_call, this._get_account_id());
    System.require(is_authorized, `not authorized by the account`);

    const config = this.config_storage.get();
    System.require(config != null, "Configuration not found");

    const new_only_entry_points: u32[] = [];

    for (let i = 0; i < config!.only_entry_points.length; i++) {
      if (config!.only_entry_points[i] != args.entry_point) {
        new_only_entry_points.push(config!.only_entry_points[i]);
      }
    }

    config!.only_entry_points = new_only_entry_points;
    this.config_storage.put(config!);
  }

  /**
   * Reads the only_entry_points
   * @external
   * @readonly
   */
  get_only_entry_points(): modvalidationsignature.get_only_entry_points_result {
    const config = this.config_storage.get();
    System.require(config != null, "Configuration not found");
    return new modvalidationsignature.get_only_entry_points_result(config!.only_entry_points);
  }

  /**
   * @external
   */
  set_threshold(args: modvalidationsignature.set_threshold): void {
    const is_authorized = System.checkAuthority(authority.authorization_type.contract_call, this._get_account_id());
    System.require(is_authorized, `not authorized by the account`);

    const config = this.config_storage.get()! || new modvalidationsignature.config_storage();
    config.threshold = args.value;
    this.config_storage.put(config);
  }

  /**
   * @external
   * @readonly 
   */
  get_threshold(): modvalidationsignature.get_threshold {
    const result = new modvalidationsignature.get_threshold();
    result.value = this.config_storage.get()!.threshold;
    return result;
  }

  /**
   * @external
   */
  on_install(args: modvalidation.on_install_args): void {
    const account = new modvalidationsignature.account_id();
    account.value = System.getCaller().caller;
    this.account_id.put(account);

    const config = new modvalidationsignature.config_storage();
    config.only_entry_points = DEFAULT_ONLY_ENTRY_POINTS;
    config.threshold = DEFAULT_CONFIG_THRESHOLD;
    this.config_storage.put(config);

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
