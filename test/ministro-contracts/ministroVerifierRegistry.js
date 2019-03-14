import BigNumber from 'bignumber.js';
import ministroExecute from 'ministro-tool';
import { formatVerifier, areAddressesEqual } from '../helpers/functions';

function MinistroContract() {
  const app = {};

  /* eslint-disable-next-line */
  app.__proto__ = ministroExecute();

  app.create = async (name, location, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.create(name, location, txAttrLocal);

    let prevVerifierStatus;
    if (!expectThrow) {
      prevVerifierStatus = await app.isRegisteredVerifier(txAttrLocal.from);
    }

    const results = await app.executeAction(action, txAttrLocal, 1, 'LogVerifierRegistered', expectThrow);

    if (!expectThrow) {
      assert.exists(results.LogVerifierRegistered, 'missing LogVerifierRegistered event');
      const [logVerifierRegistered] = results.LogVerifierRegistered;

      assert(areAddressesEqual(logVerifierRegistered.id, txAttrLocal.from), 'invalid verifier address');
      assert.strictEqual(logVerifierRegistered.name.toLowerCase(), name.toLowerCase(), 'invalid name');
      assert.strictEqual(logVerifierRegistered.location, location, 'invalid location');
      assert.isTrue(logVerifierRegistered.active, 'new verifier should be active');
      assert.strictEqual(logVerifierRegistered.balance.toString(), '0', 'new verifier should have no balance');

      const verifier = await app.verifiers(txAttrLocal.from);
      assert(areAddressesEqual(logVerifierRegistered.id, verifier.id), 'should be saved onchain');
      assert.isTrue(verifier.active, 'should be active after creation onchain');

      assert.isFalse(prevVerifierStatus, 'should be NOT recognizable as verifier before registration');
      assert.isTrue(await app.isRegisteredVerifier(verifier.id), 'should be recognizable as verifier');
    }

    return results;
  };

  app.update = async (name, location, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.update(name, location, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, 1, 'LogVerifierUpdated', expectThrow);

    if (!expectThrow) {
      assert.exists(results.LogVerifierUpdated, 'missing LogVerifierUpdated event');
      const [logVerifierUpdated] = results.LogVerifierUpdated;

      assert(areAddressesEqual(logVerifierUpdated.id, txAttrLocal.from), 'invalid verifier address');
      assert.strictEqual(logVerifierUpdated.name.toLowerCase(), name.toLowerCase(), 'invalid name');
      assert.strictEqual(logVerifierUpdated.location, location, 'invalid location');

      const verifier = await app.verifiers(txAttrLocal.from);
      assert(areAddressesEqual(verifier.id, logVerifierUpdated.id), 'should be saved onchain');
      assert.strictEqual(verifier.name.toLowerCase(), name.toLowerCase(), 'invalid name');
      assert.strictEqual(verifier.location, location, 'invalid location');
    }

    return results;
  };

  app.updateActiveStatus = async (verifier, active, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.updateActiveStatus(verifier, active, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, null, 'LogUpdateActiveStatus', expectThrow);

    if (!expectThrow) {
      assert.exists(results.LogBalancePerShard, 'missing LogBalancePerShard event - balances should be updated');

      assert.exists(results.LogUpdateActiveStatus, 'missing LogUpdateActiveStatus event');
      const [logUpdateActiveStatus] = results.LogUpdateActiveStatus;

      assert(areAddressesEqual(logUpdateActiveStatus.executor, txAttrLocal.from), 'invalid executor');
      assert(areAddressesEqual(logUpdateActiveStatus.verifier, verifier), 'invalid verifier');
      assert.strictEqual(logUpdateActiveStatus.active, active, 'invalid active status');

      const savedVerifier = await app.verifiers(verifier);
      assert(areAddressesEqual(savedVerifier.id, verifier), 'should be saved onchain');
      assert.strictEqual(savedVerifier.active, active, 'invalid active status');
    }

    return results;
  };

  app.updateVerifiersPerShard = async (verifiersPerShard, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const action = () => app.instance.updateVerifiersPerShard(verifiersPerShard, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, null, null, expectThrow);

    if (!expectThrow) {
      assert.strictEqual((await app.verifiersPerShard()).toString(), verifiersPerShard.toString(), 'should be saved onchain');
    }

    return results;
  };

  app.increaseShardBalance = async (verifier, amount, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const { shard } = await app.verifiers(verifier);
    let prevShardBalance;
    if (!expectThrow) {
      prevShardBalance = await app.balancesPerShard(shard.toString());
    }

    const action = () => app.instance.increaseShardBalance(verifier, amount, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, null, null, expectThrow);

    if (!expectThrow) {
      const shardBalance = await app.balancesPerShard(shard.toString());
      assert(BigNumber(prevShardBalance).plus(amount).eq(shardBalance), 'invalid shard balance');
    }

    return results;
  };

  app.decreaseShardBalance = async (verifier, amount, txAttr, expectThrow) => {
    const txAttrLocal = app.getTxAttr(txAttr);

    const { shard } = await app.verifiers(verifier);
    let prevShardBalance;
    if (!expectThrow) {
      prevShardBalance = await app.balancesPerShard(shard.toString());
    }

    const action = () => app.instance.decreaseShardBalance(verifier, amount, txAttrLocal);

    const results = await app.executeAction(action, txAttrLocal, null, null, expectThrow);

    if (!expectThrow) {
      const shardBalance = await app.balancesPerShard(shard.toString());
      assert(BigNumber(prevShardBalance).minus(amount).eq(shardBalance), 'invalid shard balance');
    }

    return results;
  };

  app.verifiers = async address => formatVerifier(await app.instance.verifiers.call(address));

  app.uniqueNames = async hash => app.instance.uniqueNames.call(hash);
  app.balancesPerShard = async shard => app.instance.balancesPerShard.call(shard);
  app.addresses = async i => app.instance.addresses.call(i);
  app.verifiersPerShard = async () => app.instance.verifiersPerShard.call();
  app.isRegisteredVerifier = async address => app.instance.isRegisteredVerifier.call(address);

  app.getNumberOfVerifiers = async () => app.instance.getNumberOfVerifiers.call();

  return app;
}

module.exports = MinistroContract;
