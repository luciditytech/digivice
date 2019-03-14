const {
  deployStakingBank,
  deployContractRegistry,
  deployVerifierRegistry,
  deployHumanStandardToken,
} = require('../helpers/deployers');

const deployAll = async (owner) => {
  const contractRegistry = await deployContractRegistry();
  const token = await deployHumanStandardToken();
  await deployStakingBank(
    owner,
    contractRegistry.address,
    token.address,
  );
  const { ministroVerifierRegistry } = await deployVerifierRegistry(
    owner,
    contractRegistry.address,
  );

  return {
    contractRegistry,
    token,
    ministroVerifierRegistry,
  };
};

contract('VerifierRegistry', (accounts) => {
  let ministroVerifierRegistry;

  describe('#create()', async () => {
    beforeEach(async () => {
      ({ ministroVerifierRegistry } = await deployAll(accounts[0]));
      await ministroVerifierRegistry.create('paul', '127.0.0.1');
    });

    it('should register a new verifier', async () => {
      assert.equal(await ministroVerifierRegistry.getNumberOfVerifiers.call(), 1);
    });

    it('should assign the expected shard number', async () => {
      const address = await ministroVerifierRegistry.addresses(0);

      const verifier = await ministroVerifierRegistry.verifiers(address);

      assert.equal(verifier.shard, 0);
    });

    it('should have expected balance per shard', async () => {
      const address = await ministroVerifierRegistry.addresses(0);
      const verifier = await ministroVerifierRegistry.verifiers(address);

      const balance = await ministroVerifierRegistry.balancesPerShard(verifier.shard.toString());

      assert.equal(balance.toString(), '0');
    });

    it('should require verifier to not be already created', async () => {
      await ministroVerifierRegistry.create('mike', '127.0.0.1', {}, true);
    });

    it('should provide some unique name', async () => {
      await ministroVerifierRegistry.create('paul', '127.0.0.2', {
        from: accounts[1],
      }, true);
    });
  });

  describe('#getNumberOfVerifiers()', () => {
    beforeEach(async () => {
      ({ ministroVerifierRegistry } = await deployAll(accounts[0]));

      await ministroVerifierRegistry.create('mike', '127.0.0.1');
    });

    it('should return number of verifiers', async () => {
      assert.equal(await ministroVerifierRegistry.getNumberOfVerifiers(), 1);
    });
  });

  // TODO: create tests for `addBalance` and `withdrawBalance` when stake bank will be ready

  describe('#update()', () => {
    beforeEach(async () => {
      ({ ministroVerifierRegistry } = await deployAll(accounts[0]));
    });

    it('should update verifier location', async () => {
      await ministroVerifierRegistry.create('mike', '127.0.0.1');

      await ministroVerifierRegistry.update('mike', '1.1.1.1');

      const verifier = await ministroVerifierRegistry.verifiers(accounts[0]);

      assert.equal(verifier.location, '1.1.1.1');
    });

    it('should require verifier to be created already', async () => {
      await ministroVerifierRegistry.update('mike', '1.2.3.4', {}, true);
    });

    it('should update with some unique name', async () => {
      await ministroVerifierRegistry.create('mike', '127.0.0.1');

      await ministroVerifierRegistry.create('paul', '127.0.0.1', {
        from: accounts[1],
      });

      await ministroVerifierRegistry.update('Mike', '127.0.0.1', {
        from: accounts[1],
      }, true);
    });
  });

  describe('#updateActiveStatus()', () => {
    before(async () => {
      ({ ministroVerifierRegistry } = await deployAll(accounts[0]));
    });

    it('should be active after creation', async () => {
      await ministroVerifierRegistry.create('mike', '127.0.0.1');
    });

    it('should be able to disable verifier by contract owner', async () => {
      await ministroVerifierRegistry.updateActiveStatus(accounts[0], false);
    });

    it('should NOT be able to update active state by not a contract owner', async () => {
      const prevVerifier = await ministroVerifierRegistry.verifiers(accounts[0]);

      await ministroVerifierRegistry.updateActiveStatus(
        accounts[0],
        !prevVerifier.active,
        { from: accounts[1] },
        true,
      );

      const verifier = await ministroVerifierRegistry.verifiers(accounts[0]);
      assert.isTrue(prevVerifier.active === verifier.active);
    });

    it('should be able to active back verifier by contract owner', async () => {
      await ministroVerifierRegistry.updateActiveStatus(accounts[0], true);
    });
  });

  describe('#updateVerifiersPerShard()', () => {
    beforeEach(async () => {
      ({ ministroVerifierRegistry } = await deployAll(accounts[0]));
    });

    it('should NOT change number of verifiers per shard to zero', async () => {
      await ministroVerifierRegistry.updateVerifiersPerShard(0, {}, true);
    });

    it('should change number of verifiers per shard', async () => {
      await ministroVerifierRegistry.updateVerifiersPerShard(5);
    });
  });

  describe('increasing/decreasing shard balance', () => {
    before(async () => {
      ({ ministroVerifierRegistry } = await deployAll(accounts[0]));
    });

    it('only StakingBank should have access to increaseShardBalance()', async () => {
      await ministroVerifierRegistry.increaseShardBalance(accounts[1], 1, {}, true);
    });

    it('only StakingBank should have access to decreaseShardBalance()', async () => {
      await ministroVerifierRegistry.decreaseShardBalance(accounts[1], 1, {}, true);
    });
  });
});
