const getConfig = require('../scripts/getConfig');

const VerifierRegistry = artifacts.require('VerifierRegistry');
const VerifierRegistryStorage = artifacts.require('VerifierRegistryStorage');

module.exports = (deployer, network, accounts) => deployer.then(async () => {
  const { options, config } = getConfig(network, accounts);

  const verifierRegistryStorage = await VerifierRegistryStorage.deployed();

  const instance = await deployer.deploy(
    VerifierRegistry,
    config.ContractRegistry.address,
    verifierRegistryStorage.address,
    options,
  );

  await verifierRegistryStorage.initStorageOwner(instance.address);

  return instance;
});
