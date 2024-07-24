## **Mod Validation Signature**

### **Overview**

`ModValidationSignature` is a specialized validation module within the Veive protocol, designed to verify the authenticity of transaction signatures. Unlike modules that implement signature verification algorithms directly, `ModValidationSignature` delegates this responsibility to dedicated "sign" modules. This separation allows for a modular and flexible approach to handling different signature methods, such as ECDSA or WebAuthn. By default, this module is installed in the scope of the "allow" entry point, ensuring that operations are pre-authorized with valid signatures before execution.

### **Functional Description**

#### **Purpose and Functionality**

The primary role of `ModValidationSignature` is to validate transaction signatures, ensuring the integrity and authenticity of operations. The module does not itself verify the signature's algorithmic correctness; instead, it invokes the `is_valid_signature` method of the account, which uses the active "sign" module installed in the account. This design allows `ModValidationSignature` to support various signature methods seamlessly, provided a corresponding sign module is installed.

Key functionalities include:
- **Signature Validation**: The module iterates through all signatures attached to a transaction and verifies each one using the active sign module.
- **Threshold Management**: It supports a configurable threshold for the number of valid signatures required to approve an operation, providing flexibility for scenarios like multi-signature wallets.
- **Delegation to Sign Modules**: By offloading the actual signature verification to specialized sign modules, `ModValidationSignature` can accommodate different cryptographic methods without needing direct implementation.

In a "classic" wallet setup, this module might be installed with an "any" scope, meaning it would validate signatures for all operations. However, the pre-authorization mechanism used in Veive offers additional security by validating the entire operation, not just the signature.

### **Technical Implementation**

#### **Key Components and Methods**

1. **Storage Objects**
   - `account_id`: Stores the ID of the associated account, ensuring the module can manage permissions correctly.
   - `threshold`: Stores the minimum number of valid signatures required for an operation to be considered valid. This can be set to zero for strict validation (all signatures must be valid) or adjusted for multi-signature scenarios.

2. **Methods**
   - **`is_valid_operation`**:
     - **Purpose**: Validates an operation by checking the signatures against the active sign module.
     - **Implementation**: This method retrieves the transaction signatures and checks each one using the `is_valid_signature` method from the account interface. It counts the number of valid signatures and compares it against the stored threshold to determine if the operation is valid.

   - **`set_threshold`**:
     - **Purpose**: Allows setting the number of valid signatures required.
     - **Implementation**: The threshold can be adjusted to control how many signatures are necessary for an operation's validity, providing flexibility for different security models.

   - **`get_threshold`**:
     - **Purpose**: Retrieves the current threshold setting.
     - **Implementation**: Returns the stored threshold value, giving users and other modules visibility into the validation criteria.

   - **`on_install`**:
     - **Purpose**: Initializes the module upon installation.
     - **Implementation**: This method sets up the account ID and initializes the threshold to a default value, ensuring the module is ready to validate operations immediately after installation.

   - **`manifest`**:
     - **Purpose**: Provides metadata and configuration settings for the module.
     - **Implementation**: Returns details such as the module's name, description, type ID, and default scope, which is typically set to "allow" for pre-authorization checks.

### **Scope and Context**

The default scope for `ModValidationSignature` is "allow," meaning it is specifically configured to validate signatures during the pre-authorization phase of an operation. This scope is crucial for ensuring that any operation requiring explicit user consent (e.g., transferring assets) is authorized only if the signatures are valid and meet the set threshold. However, in a "classic" wallet configuration, this module could be installed in the "any" scope, validating signatures for all operations. This broad scope is less secure compared to the pre-authorization mechanism, as it does not validate the entire operation.

### **Usage**

#### **Installation**

To install the `ModValidationSignature` module, ensure you have the Veive protocol set up on your Koinos blockchain environment. Install the module using yarn:

```bash
yarn add @veive/mod-validation-signature-as
```

Deploy the module contract on the Koinos blockchain and install it on the desired account using the `install_module` method provided by the Veive account interface. During installation, the `on_install` method initializes necessary settings, including the account ID and signature threshold.

#### **Scripts**

##### Build

To compile the package, run:

```bash
yarn build
```

##### Dist

To create a distribution, run:

```bash
yarn dist
```

##### Test

To test the package, use:

```bash
yarn jest
```

### **Contributing**

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/veiveprotocol/mod-validation-signature).

### **License**

This project is licensed under the MIT License. See the LICENSE file for details.