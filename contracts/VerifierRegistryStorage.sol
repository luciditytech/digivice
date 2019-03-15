pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "contract-registry/contracts/storage/StorageBase.sol";

contract VerifierRegistryStorage is StorageBase {

  struct Verifier {
    address id;
    string name;
    string location;
    bool active;
    uint256 shard;
    bool enable;
  }

  mapping(address => Verifier) public verifiers;
  mapping(bytes32 => bool) public uniqueNames;

  /// @dev shard => balance
  mapping(uint256 => uint256) public balancesPerShard;

  address[] public addresses;
  uint256 public verifiersPerShard;

  constructor(uint256 _verifiersPerShard) public {
    require(_verifiersPerShard > 0, "_verifiersPerShard must be gt 0");
    verifiersPerShard = _verifiersPerShard;
  }

  function addressesLength() external view returns (uint256) {
    return addresses.length;
  }

  function addressesPush(address _addr)
  external
  onlyFromStorageOwner {
    addresses.push(_addr);
  }

  function setVerifier(
    address _id,
    string calldata _name,
    string calldata _location,
    bool _active,
    uint256 _shard,
    bool _enable
  )
  external
  onlyFromStorageOwner {
    verifiers[_id] = Verifier(_id, _name, _location, _active, _shard, _enable);
  }

  function setVerifierName(address _verifier, string calldata _name)
  external
  onlyFromStorageOwner {
    verifiers[_verifier].name = _name;
  }

  function setVerifierLocation(address _verifier, string calldata _location)
  external
  onlyFromStorageOwner {
    verifiers[_verifier].location = _location;
  }

  function setVerifierActive(address _verifier, bool _active)
  external
  onlyFromStorageOwner {
    verifiers[_verifier].active = _active;
  }

  function setVerifierEnable(address _verifier, bool _enable)
  external
  onlyFromStorageOwner {
    verifiers[_verifier].enable = _enable;
  }

  function setVerifierShard(address _verifier, uint256 _shard)
  external
  onlyFromStorageOwner {
    verifiers[_verifier].shard = _shard;
  }

  function setBalancePerShard(uint256 _shard, uint256 _balance)
  external
  onlyFromStorageOwner {
    balancesPerShard[_shard] = _balance;
  }

  function setVerifiersPerShard(uint256 _verifiersPerShard)
  external
  onlyFromStorageOwner {
    verifiersPerShard = _verifiersPerShard;
  }

  function setUniqueNames(bytes32 _hash, bool _exists)
  external
  onlyFromStorageOwner {
    uniqueNames[_hash] = _exists;
  }

  function getVerifierName(address _verifier) external view returns (string memory) {
    return verifiers[_verifier].name;
  }

  function getVerifierLocation(address _verifier) external view returns (string memory) {
    return verifiers[_verifier].location;
  }

  function getVerifierActive(address _verifier) external view returns (bool) {
    return verifiers[_verifier].active;
  }

  function getVerifierEnable(address _verifier) external view returns (bool) {
    return verifiers[_verifier].enable;
  }

  function getVerifierEnableActive(address _verifier) external view returns (bool, bool) {
    return (verifiers[_verifier].enable, verifiers[_verifier].active);
  }

  function getVerifierShard(address _verifier) external view returns (uint256) {
    return verifiers[_verifier].shard;
  }
}
