pragma solidity 0.5.0;

import "staking-bank/contracts/interfaces/IStakingBank.sol";
import "contract-registry/contracts/interfaces/IRegistrable.sol";
import "../../interfaces/IVerifierRegistry.sol";

contract StakingBank is IStakingBank, IRegistrable {
  mapping(address => uint256) private balances;

  IVerifierRegistry private verifierRegistry;

  constructor(IVerifierRegistry _verifierRegistry)
  public {
    verifierRegistry = _verifierRegistry;
  }

  function setBalance(
    address _verifier,
    uint256 _balance
  )
  external {
    uint256 oldBalance = balances[_verifier];
    balances[_verifier] = _balance;
    oldBalance < _balance
      ? verifierRegistry.increaseShardBalance(_verifier, _balance)
      : verifierRegistry.decreaseShardBalance(_verifier, balances[_verifier]);
  }

  function stakingBalance(address _verifier) external view returns (uint256) {
    return balances[_verifier];
  }

  bytes32 constant NAME = "StakingBank";

  function contractName() external view returns (bytes32) {
    return NAME;
  }

  function register() external returns (bool) {
    return true;
  }

  function withdraw(uint256 _value) external returns (bool) {
    require(false, "not implemented");
  }

  function receiveApproval(address, uint256, address, bytes calldata) external returns (bool) {
    require(false, "not implemented");
  }

  function token() external view returns (IERC20) {
    require(false, "not implemented");
  }

  function isRegistered() external view returns (bool) {
    require(false, "not implemented");
  }

  function unregister(IRegistrable _newInstance) external {
    require(false, "not implemented");
  }
}
