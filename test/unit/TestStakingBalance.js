import { fromAscii } from 'web3-utils';

const BigNumber = require('bignumber.js');

const StakingBankArtifact = artifacts.require('StakingBank');
const ContractRegistryArtifact = artifacts.require('ContractRegistry');

const {
  deployVerifierRegistry,
} = require('../helpers/deployers');

contract('VerifierRegistry', (accounts) => {
  let ministroVerifierRegistry;
  let stakingBank;
  const verifier = accounts[1];
  let verifierShard;

  describe('when all dependency contracts are in place', async () => {
    before(async () => {
      ({ ministroVerifierRegistry } = await deployVerifierRegistry(accounts[0]));
      const contractRegistry = await ContractRegistryArtifact
        .at(await ministroVerifierRegistry.instance.contractRegistry.call());
      stakingBank = await StakingBankArtifact.at(await contractRegistry.contractByName.call(fromAscii('StakingBank')));
    });

    it('should throw when set balance for verifier that is not created', async () => {
      try {
        await stakingBank.setBalance(verifier, 1);
        assert(false, 'should throw');
      } catch (e) {
        // OK
      }
    });

    it('should have NO balance per shard', async () => {
      const balance = await ministroVerifierRegistry.balancesPerShard(0);
      assert(balance.toString(), '0', 'should be no balance per shard');
    });

    describe('when verifier is registered and active/enabled', async () => {
      before(async () => {
        await ministroVerifierRegistry.create('Verifier', 'Location', { from: verifier });
        await stakingBank.setBalance(verifier, 1);
        await ministroVerifierRegistry.updateActiveStatus(true, { from: verifier });
        await ministroVerifierRegistry.updateEnableStatus(verifier, true);
      });

      it('should have balance', async () => {
        const { balance, shard } = await ministroVerifierRegistry.verifiers(verifier);
        assert(BigNumber(balance).gt(0), 'should have a balance');
        verifierShard = shard.toString();
      });

      it('should have valid balance per shard', async () => {
        const balance = await ministroVerifierRegistry.balancesPerShard(verifierShard);
        assert(balance.toString(), '1', 'invalid balance per shard');
      });

      it('should increase balance per shard', async () => {
        await stakingBank.setBalance(verifier, 11);
        const balance = await ministroVerifierRegistry.balancesPerShard(verifierShard);
        assert(balance.toString(), '11', 'invalid balance per shard');
      });

      it('should decrease balance per shard', async () => {
        await stakingBank.setBalance(verifier, 2);
        const balance = await ministroVerifierRegistry.balancesPerShard(verifierShard);
        assert(balance.toString(), '2', 'invalid balance per shard');
      });

      describe('when verifier is not active BUT enabled', async () => {
        before(async () => {
          await ministroVerifierRegistry.updateActiveStatus(false, { from: verifier });
          const { active, enable } = await ministroVerifierRegistry.verifiers(verifier);
          assert(!active);
          assert(enable);
        });

        it('should have NO balance', async () => {
          const { balance } = await ministroVerifierRegistry.verifiers(accounts[1]);
          assert(BigNumber(balance).eq(0), 'should have NO balance');
        });

        it('should have NO balance per shard', async () => {
          const balance = await ministroVerifierRegistry.balancesPerShard(verifierShard);
          assert(balance.toString(), '0', 'invalid balance per shard');
        });

        describe('when verifier is active BUT not enabled', async () => {
          before(async () => {
            await ministroVerifierRegistry.updateActiveStatus(true, { from: verifier });
            await ministroVerifierRegistry.updateEnableStatus(verifier, false);
            const { active, enable } = await ministroVerifierRegistry.verifiers(verifier);
            assert(active);
            assert(!enable);
          });

          it('should have NO balance also', async () => {
            const { balance } = await ministroVerifierRegistry.verifiers(accounts[1]);
            assert(BigNumber(balance).eq(0), 'should have NO balance');
          });

          it('should have NO balance per shard also', async () => {
            const balance = await ministroVerifierRegistry.balancesPerShard(verifierShard);
            assert(balance.toString(), '0', 'invalid balance per shard');
          });
        });
      });
    });
  });
});
