const BigNumber = require('bignumber.js');

const {
  deployStakingBank,
  deployContractRegistry,
  deployVerifierRegistry,
  deployHumanStandardToken,
} = require('../helpers/deployers');

contract('VerifierRegistry', (accounts) => {
  let contractRegistry;
  let ministroVerifierRegistry;
  let stakingBank;
  let token;
  const verifier = accounts[1];

  describe('when all dependency contracts are in place', async () => {
    before(async () => {
      contractRegistry = await deployContractRegistry();
      token = await deployHumanStandardToken();
      stakingBank = await deployStakingBank(
        accounts[0],
        contractRegistry.address,
        token.address,
      );
      ({ ministroVerifierRegistry } = await deployVerifierRegistry(
        accounts[0],
        contractRegistry.address,
      ));
    });

    describe('when verifier is registered and active/enabled', async () => {
      before(async () => {
        await ministroVerifierRegistry.create('Verifier', 'Location', { from: verifier });
        await ministroVerifierRegistry.updateActiveStatus(true, { from: verifier });
        await ministroVerifierRegistry.updateEnableStatus(verifier, true);
        await token.transfer(verifier, 1);
        await token.approveAndCall(stakingBank.address, 1, '0x0', { from: verifier });
      });

      it('should have balance', async () => {
        const { balance } = await ministroVerifierRegistry.verifiers(verifier);
        assert(BigNumber(balance).gt(0), 'should have a balance');
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
        });
      });
    });
  });
});
