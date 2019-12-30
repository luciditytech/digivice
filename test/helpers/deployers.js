const StakingBankArtifact = artifacts.require('StakingBank');
const ContractRegistryArtifact = artifacts.require('ContractRegistry');
const VerifierRegistryStorageArtifact = artifacts.require('VerifierRegistryStorage');
const VerifierRegistryArtifact = artifacts.require('VerifierRegistry');

const verifierRegistryConfig = require('../../config/development');

const VerifierRegistryUtil = require('../ministro-contracts/ministroVerifierRegistry');

const deployContractRegistry = async () => ContractRegistryArtifact.new();

const deployStakingBank = async (owner, contractRegistryAddr, verifierRegistryAddr) => {
  const contractRegistry = await ContractRegistryArtifact.at(contractRegistryAddr);

  const stakingBankInstance = await StakingBankArtifact.new(
    verifierRegistryAddr,
  );

  await contractRegistry.add(stakingBankInstance.address);

  return stakingBankInstance;
};

async function deployVerifierRegistry(owner) {
  const contractRegistry = await deployContractRegistry();

  const verifierRegistryStorageInstance = await VerifierRegistryStorageArtifact.new(
    verifierRegistryConfig.VerifierRegistry.verifiersPerShard,
  );

  const verifierRegistryInstance = await VerifierRegistryArtifact.new(
    contractRegistry.address,
    verifierRegistryStorageInstance.address,
  );

  await verifierRegistryStorageInstance.initStorageOwner(
    verifierRegistryInstance.address,
    { from: owner },
  );

  await contractRegistry.add(verifierRegistryInstance.address);

  await deployStakingBank(owner, contractRegistry.address, verifierRegistryInstance.address);

  const ministroVerifierRegistry = VerifierRegistryUtil();
  ministroVerifierRegistry.setInstanceVar(verifierRegistryInstance);
  ministroVerifierRegistry.setFromVar(owner);

  return {
    verifierRegistryInstance,
    ministroVerifierRegistry,
  };
}


module.exports = {
  deployVerifierRegistry,
};
