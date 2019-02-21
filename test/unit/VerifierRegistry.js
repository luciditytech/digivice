const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

const BN = require('bn.js');
const { fromAscii } = require('web3-utils');

const HumanStandardToken = artifacts.require('token-sale-contracts/contracts/HumanStandardToken.sol');
const VerifierRegistry = artifacts.require('VerifierRegistry');

const tokenAddress = `0x${'2'.repeat(40)}`;

function formatVerifier(verifier) {
  return {
    id: verifier[0],
    name: verifier[1],
    location: verifier[2],
    active: verifier[3],
    balance: verifier[4],
    shard: verifier[5],
  };
}

contract('VerifierRegistry', (accounts) => {
  describe('#create()', () => {
    let verifierRegistryContract;
    let eventLog;

    beforeEach(async () => {
      verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);

      await verifierRegistryContract.create('paul', '127.0.0.1')
        .then((response) => {
          [eventLog] = response.logs;
        });
    });

    it('should register a new verifier', async () => {
      assert.equal(await verifierRegistryContract.getNumberOfVerifiers.call(), 1);
    });

    it('should assign the expected shard number', async () => {
      const address = await verifierRegistryContract.addresses.call(0);

      const verifier = await verifierRegistryContract.verifiers.call(address);

      const shard = verifier[4].toNumber();

      assert.equal(shard, 0);
    });

    it('should have expected balance per shard', async () => {
      const address = await verifierRegistryContract.addresses.call(0);
      const verifier = await verifierRegistryContract.verifiers.call(address);

      const balance = await verifierRegistryContract.balancesPerShard.call(verifier[4].toString());

      assert.equal(balance.toString(), '0');
    });

    it('should require verifier to not be already created', async () => {
      await assert.isRejected(verifierRegistryContract.create('mike', '127.0.0.1'));
    });

    it('should provide some unique name', async () => {
      await assert.isRejected(verifierRegistryContract.create('paul', '127.0.0.2', {
        from: accounts[1],
      }));
    });

    it('should emit event when verifier has registered', () => {
      assert.equal(eventLog.event, 'LogVerifierRegistered');
    });

    describe('after creating a verifier', () => {
      it('should emit create event with verifier id', () => {
        assert.equal(eventLog.args.id, accounts[0]);
      });

      it('should emit create event with verifier location', () => {
        assert.equal(eventLog.args.name, 'paul');
      });

      it('should emit create event with verifier location', () => {
        assert.equal(eventLog.args.location, '127.0.0.1');
      });

      it('should emit create event with verifier active', () => {
        assert.equal(eventLog.args.active, true);
      });

      it('should emit create event with verifier balance', () => {
        assert.equal(eventLog.args.balance.toNumber(), 0);
      });

      it('should emit create event with verifier shard', () => {
        assert.equal(eventLog.args.shard.toNumber(), 0);
      });
    });
  });

  describe('#getNumberOfVerifiers()', () => {
    let verifierRegistryContract;

    beforeEach(async () => {
      verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);

      await verifierRegistryContract.create('mike', '127.0.0.1');
    });

    it('should return number of verifiers', async () => {
      assert.equal(await verifierRegistryContract.getNumberOfVerifiers.call(), 1);
    });
  });

  describe('#receiveApproval()', () => {
    describe('when transfer of tokens is successful', () => {
      let verifierRegistryContract;
      let cost;
      let humanStandardToken;

      beforeEach(async () => {
        cost = new BN('1000', 10);

        verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);

        humanStandardToken = await HumanStandardToken.deployed();

        await verifierRegistryContract.updateTokenAddress(humanStandardToken.address, {
          from: accounts[0],
        });

        await humanStandardToken.approve(verifierRegistryContract.address, cost.toNumber(), {
          from: accounts[0],
        });

        await verifierRegistryContract.create('mike', '127.0.0.1');

        await verifierRegistryContract.receiveApproval(accounts[0], 0, tokenAddress, fromAscii(''));
      });

      it('should deposit tokens to stake', async () => {
        const verifier = await verifierRegistryContract.verifiers.call(accounts[0]);

        assert.equal(verifier[4], cost.toNumber());
      });

      it('should have valid total balance per shard', async () => {
        const verifier = await verifierRegistryContract.verifiers.call(accounts[0]);
        const balance = await verifierRegistryContract.balancesPerShard.call(
          verifier[5].toString(),
        );

        assert.equal(balance.toString(), cost.toString());
      });
    });
  });

  describe('#update()', () => {
    let verifierRegistryContract;

    beforeEach(async () => {
      verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);
    });

    it('should update verifier location', async () => {
      await verifierRegistryContract.create('mike', '127.0.0.1');

      await verifierRegistryContract.update('mike', '1.1.1.1');

      const verifier = await verifierRegistryContract.verifiers(accounts[0]);

      assert.equal(verifier[2], '1.1.1.1');
    });

    it('should require verifier to be created already', async () => {
      await verifierRegistryContract.update('mike', '1.2.3.4')
        .catch((error) => {
          assert.isDefined(error);
        });
    });

    it('should update with some unique name', async () => {
      await verifierRegistryContract.create('mike', '127.0.0.1');

      await verifierRegistryContract.create('paul', '127.0.0.1', {
        from: accounts[1],
      });

      await assert.isRejected(verifierRegistryContract.update('Mike', '127.0.0.1', {
        from: accounts[1],
      }));
    });

    it('should emit event when verifier has been updated', async () => {
      let eventLog;

      await verifierRegistryContract.create('mike', '127.0.0.1');

      await verifierRegistryContract.update('mike', '1.1.1.1')
        .then((response) => {
          [eventLog] = response.logs;
        });

      assert.equal(eventLog.event, 'LogVerifierUpdated');
    });

    describe('after updating a verifier', () => {
      let eventLog;

      beforeEach(async () => {
        await verifierRegistryContract.create('mike', '127.0.0.1');

        await verifierRegistryContract.update('mike', '1.1.1.1')
          .then((response) => {
            [eventLog] = response.logs;
          });
      });

      it('should emit update event with verifier id', () => {
        assert.equal(eventLog.args.id, accounts[0]);
      });

      it('should emit update event with verifier id', () => {
        assert.equal(eventLog.args.name, 'mike');
      });

      it('should emit update event with verifier location', () => {
        assert.equal(eventLog.args.location, '1.1.1.1');
      });

      it('should emit update event with verifier active', () => {
        assert.equal(eventLog.args.active, true);
      });

      it('should emit update event with verifier balance', () => {
        assert.equal(eventLog.args.balance.toNumber(), 0);
      });

      it('should emit update event with verifier shard', () => {
        assert.equal(eventLog.args.shard.toNumber(), 0);
      });
    });
  });

  describe('#updateActiveStatus()', () => {
    let verifierRegistryContract;

    before(async () => {
      verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);
    });

    it('should be active after creation', async () => {
      await verifierRegistryContract.create('mike', '127.0.0.1');
      const verifier = formatVerifier(await verifierRegistryContract.verifiers(accounts[0]));

      assert.isTrue(verifier.active);
    });

    it('should be able to disable verifier by contract owner', async () => {
      await verifierRegistryContract.updateActiveStatus(accounts[0], false);
      const verifier = formatVerifier(await verifierRegistryContract.verifiers(accounts[0]));

      assert.isTrue(!verifier.active);
    });

    it('should NOT be able to update active state by not a contract owner', async () => {
      const prevVerifier = formatVerifier(await verifierRegistryContract.verifiers(accounts[0]));
      try {
        await verifierRegistryContract.updateActiveStatus(
          accounts[0],
          !prevVerifier.active,
          { from: accounts[1] },
        );
        assert(false, 'should throw');
      } catch (e) {
        // OK
      }
      const verifier = formatVerifier(await verifierRegistryContract.verifiers(accounts[0]));
      assert.isTrue(prevVerifier.active === verifier.active);
    });

    it('should be able to active back verifier by contract owner', async () => {
      await verifierRegistryContract.updateActiveStatus(accounts[0], true);
      const verifier = formatVerifier(await verifierRegistryContract.verifiers(accounts[0]));

      assert.isTrue(verifier.active);
    });
  });

  describe('#withdraw()', () => {
    describe('when withdraw of tokens is successful', () => {
      let cost;
      let humanStandardToken;
      let verifierRegistryContract;
      let withdraw;

      beforeEach(async () => {
        cost = new BN('1000', 10);
        withdraw = new BN('50', 10);

        verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);

        humanStandardToken = await HumanStandardToken.deployed();

        await verifierRegistryContract.updateTokenAddress(humanStandardToken.address, {
          from: accounts[0],
        });

        await humanStandardToken.approve(
          verifierRegistryContract.address,
          cost.toNumber(),
          { from: accounts[0] },
        );

        await verifierRegistryContract.create('mike', '127.0.0.1');

        await verifierRegistryContract.receiveApproval(accounts[0], 0, tokenAddress, fromAscii(''));

        await verifierRegistryContract.withdraw(
          withdraw.toNumber(),
          { from: accounts[0] },
        );
      });

      it('should withdraw tokens from stake', async () => {
        const balance = new BN('950', 10);
        const verifier = await verifierRegistryContract.verifiers.call(accounts[0]);

        assert.equal(verifier[4], balance.toNumber());
      });

      it('should have valid total balance per shard after withdraw', async () => {
        const verifier = await verifierRegistryContract.verifiers.call(accounts[0]);
        const balance = await verifierRegistryContract.balancesPerShard.call(
          verifier[5].toString(),
        );

        assert.equal(balance.toString(), (cost - withdraw).toString());
      });
    });
  });

  describe('#updateTokenAddress()', () => {
    let verifierRegistryContract;

    beforeEach(async () => {
      verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);

      await verifierRegistryContract.create('mike', '127.0.0.1');
    });

    it('should change token address', async () => {
      const newTokkenAddr = `0x${'3'.repeat(40)}`;
      await verifierRegistryContract.updateTokenAddress(newTokkenAddr);

      assert.equal(await verifierRegistryContract.tokenAddress(), newTokkenAddr);
    });
  });

  describe('#updateVerifiersPerShard()', () => {
    let verifierRegistryContract;

    beforeEach(async () => {
      verifierRegistryContract = await VerifierRegistry.new(tokenAddress, 3);
    });

    it('should change number of verifiers per shard', async () => {
      await verifierRegistryContract.updateVerifiersPerShard(5);

      const verifiersPerShard = await verifierRegistryContract.verifiersPerShard();

      assert.equal(verifiersPerShard, 0x5);
    });
  });
});
