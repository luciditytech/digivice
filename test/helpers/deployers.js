const StakingBankStorage = artifacts.require('StakingBankStorage');
const StakingBank = artifacts.require('StakingBank');
const ContractRegistry = artifacts.require('ContractRegistry');
const VerifierRegistryStorage = artifacts.require('VerifierRegistryStorage');
const VerifierRegistry = artifacts.require('VerifierRegistry');
const HumanStandardToken = artifacts.require('HumanStandardToken');

const tokenConf = require('token-sale-contracts/conf/development');
const verifierRegistryConfig = require('../../config/development');

const VerifierRegistryUtil = require('../ministro-contracts/ministroVerifierRegistry');

const deployContractRegistry = async () => ContractRegistry.new();

const deployHumanStandardToken = async () => HumanStandardToken.new(
  tokenConf.total,
  tokenConf.name,
  tokenConf.decimals,
  tokenConf.symbol,
);

const deployStakingBank = async (owner, contractRegistryAddr, tokenAddr) => {
  const contractRegistry = await ContractRegistry.at(contractRegistryAddr);

  const storage = await StakingBankStorage.new(tokenAddr);

  const stakingBankInstance = await StakingBank.new(
    contractRegistryAddr,
    storage.address,
  );

  await storage.initStorageOwner(stakingBankInstance.address);
  await contractRegistry.add(stakingBankInstance.address);

  return stakingBankInstance;
};

async function deployVerifierRegistry(owner, contractRegistryAddr) {
  const contractRegistry = await ContractRegistry.at(contractRegistryAddr);
  const verifierRegistryStorageInstance = await VerifierRegistryStorage.new(
    verifierRegistryConfig.VerifierRegistry.verifiersPerShard,
  );

  const verifierRegistryInstance = await VerifierRegistry.new(
    contractRegistryAddr,
    verifierRegistryStorageInstance.address,
  );

  await verifierRegistryStorageInstance.initStorageOwner(
    verifierRegistryInstance.address,
    { from: owner },
  );

  const name = await verifierRegistryInstance.contractName.call();
  const addr = await contractRegistry.contractByName(name);

  if (parseInt(addr, 16) === 0) {
    await contractRegistry.add(verifierRegistryInstance.address);
  } else if (addr.toLowerCase() === verifierRegistryInstance.address.toLowerCase()) {
    // we are good
  } else {
    await contractRegistry.update(verifierRegistryInstance.address);
  }

  const ministroVerifierRegistry = VerifierRegistryUtil();
  ministroVerifierRegistry.setInstanceVar(verifierRegistryInstance);
  ministroVerifierRegistry.setFromVar(owner);

  return {
    verifierRegistryInstance,
    ministroVerifierRegistry,
  };
}


module.exports = {
  deployContractRegistry,
  deployVerifierRegistry,
  deployHumanStandardToken,
  deployStakingBank,
};
