const getConfig = require('../scripts/getConfig');

const VerifierRegistryStorage = artifacts.require('VerifierRegistryStorage');

module.exports = (deployer, network, accounts) => deployer.then(async () => {
  const { options, config } = getConfig(network, accounts);

  return deployer.deploy(
    VerifierRegistryStorage,
    config.VerifierRegistry.verifiersPerShard,
    options,
  );
});
