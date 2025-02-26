# **Mod Validation Signature**

## **Overview**

`ModValidationSignature` is a specialized validation module within the Veive protocol, designed to verify the authenticity of transaction signatures. Unlike modules that implement signature verification algorithms directly, `ModValidationSignature` delegates this responsibility to dedicated "sign" modules. This separation allows for a modular and flexible approach to handling different signature methods, such as ECDSA or WebAuthn. By default, this module is installed in the scope of the "allow" entry point, ensuring that operations are pre-authorized with valid signatures before execution.

Full documentation: https://docs.veive.io/veive-docs/framework/core-modules/mod-validation-signature

## **Usage**

### **Installation**

To install the `ModValidationSignature` module, ensure you have the Veive protocol set up on your Koinos blockchain environment. Install the module using yarn:

```bash
yarn add @veive-io/mod-validation-signature-as
```

Deploy the module contract on the Koinos blockchain and install it on the desired account using the `install_module` method provided by the Veive account interface. During installation, the `on_install` method initializes necessary settings, including the account ID and signature threshold.

### **Scripts**

#### Build

To compile the package, run:

```bash
yarn build
```

#### Dist

To create a distribution, run:

```bash
yarn dist
```

#### Test

To test the package, use:

```bash
yarn jest
```

## **Contributing**

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/veiveprotocol/mod-validation-signature).

## **License**

This project is licensed under the MIT License. See the LICENSE file for details.
