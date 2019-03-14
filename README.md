# Digivice
A collection of smart contracts for various types of on-chain registries.

---
## Status

[ ![Codeship Status for luciditytech/digivice](https://app.codeship.com/projects/bb3ae590-a8f5-0136-761d-2e2cf4f8517e/status?branch=master)](https://app.codeship.com/projects/308664)

## Prerequisites

1. [brew](http://brew.sh)

  ```sh
  ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
  ```

1. [HubFlow](http://datasift.github.io/gitflow/)

  ```sh
  brew install hubflow
  ```

> If you are on Linux

  ```sh
  git clone https://github.com/datasift/gitflow
  cd gitflow
  sudo ./install.sh
  ```

---

## Setup

1. `npm install -g truffle solhint`
  * [IDE Integrations for solhint](https://github.com/protofire/solhint#ide-integrations)
1. `git clone git@github.com:luciditytech/digivice.git`
1. `npm install`
1. `git hf init`

---

## Compiling and migrating smart contracts

1. `truffle compile`
1. `truffle migrate`

---

## Testing smart contracts

> Be sure compiled contracts are latest before testing
1. `npm run lint`
1. `npm run test`
1. With code coverage: `npm run coverage`

---

## Linting smart contracts
1. `solhint "contracts/**/*.sol"`

## Deploying

### Adding completely new instances for a first time

1. deploy both:
   - `VerifierRegistryStorage.sol`
   - `VerifierRegistry.sol`
1. validate code for both contracts, use `truffle-flattener` to help:
   - `truffle-flattener ./contracts/VerifierRegistryStorage.sol > all_storage.sol`
   - `truffle-flattener ./contracts/VerifierRegistry.sol > all.sol`
1. connect storage: 
   - go to storage contract and call `initStorageOwner()`
   - to verify that you connected storage properly, go to registry contract 
     and call any read method - if its throw, means you failed with initiation of storage.
1. add it to the `ContractRegistry`: 
   - call `ContractRegistry.add()` providing your contract address.
   - verify process by calling `ContractRegistry.contractByName()` 
     to see if contract is registered. 
     
Example:

```
const ContractRegistry = artifacts.require('ContractRegistry');
const contractRegistry = await ContractRegistry.at(config.ContractRegistry.address);
await contractRegistry.add(VerifierRegistry.address);
```

## Contract addresses

### Storage

* development: [0xc1dd0e2ad3e65359541673545ce87964eaf708a9](https://ropsten.etherscan.io/address/0xc1dd0e2ad3e65359541673545ce87964eaf708a9#code)
* staging: [0x4e7f37c962bf4fb8aa1c7de57a6b33dd0a6a2e53](https://ropsten.etherscan.io/address/0x4e7f37c962bf4fb8aa1c7de57a6b33dd0a6a2e53#code)

## Registry

* development: [0x0e27485ea11bbc86be07263d32894e1a720067cd](https://ropsten.etherscan.io/address/0x0e27485ea11bbc86be07263d32894e1a720067cd#code)
* staging: [0xe9774a4088b04312fec19c245a778cc6d406ef4e](https://ropsten.etherscan.io/address/0xe9774a4088b04312fec19c245a778cc6d406ef4e#code)
