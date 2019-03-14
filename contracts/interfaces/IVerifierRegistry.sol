pragma solidity 0.5.0;

interface IVerifierRegistry {

  function verifiers(address) external view returns (
    address id,
    string memory name,
    string memory location,
    bool active,
    uint256 balance,
    uint256 shard
  );

  function uniqueNames(bytes32) external view returns (bool);
  function balancesPerShard(uint256) external view returns (uint256);
  function addresses(uint256) external view returns (address);
  function verifiersPerShard() external view returns (uint256);

  function isRegisteredVerifier(address) external view returns (bool);

  function updateActiveStatus(address _verifier, bool _active) external;

  function increaseShardBalance(address _verifier, uint256 _amount) external returns (bool);
  function decreaseShardBalance(address _verifier, uint256 _amount) external returns (bool);
}
