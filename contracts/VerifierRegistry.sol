pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "token-sale-contracts/contracts/Token.sol";
import "token-sale-contracts/contracts/HumanStandardToken.sol";

contract VerifierRegistry is Ownable {
  event LogVerifierRegistered(
    address id,
    string name,
    string location,
    bool active,
    uint256 balance,
    uint256 shard
  );

  event LogVerifierUpdated(
    address id,
    string name,
    string location,
    bool active,
    uint256 balance,
    uint256 shard
  );

  event LogBalancePerShard(uint256 shard, uint256 balance);

  event LogUpdateActiveStatus(address executor, address verifier, bool active);

  struct Verifier {
    address id;
    string name;
    string location;
    bool active;
    uint256 balance;
    uint256 shard;
  }

  mapping(address => Verifier) public verifiers;
  mapping(bytes32 => bool) public uniqueNames;

  /// @dev shard => balance
  mapping(uint256 => uint256) public balancesPerShard;

  address[] public addresses;
  address public tokenAddress;
  uint256 public verifiersPerShard;

  constructor(address _tokenAddress, uint256 _verifiersPerShard)
  public {
    tokenAddress = _tokenAddress;
    verifiersPerShard = _verifiersPerShard;
  }

  function create(string memory _name, string memory _location) public {
    Verifier storage verifier = verifiers[msg.sender];

    require(verifier.id == address(0), "verifier already exists");

    bytes32 hash = hashName(_name);
    require(!uniqueNames[hash], "specified name is not available");
    uniqueNames[hash] = true;

    verifier.id = msg.sender;
    verifier.name = _name;
    verifier.location = _location;
    verifier.active = true;
    verifier.shard = uint256(addresses.length) / verifiersPerShard;

    addresses.push(verifier.id);

    emit LogVerifierRegistered(
      verifier.id,
      verifier.name,
      verifier.location,
      verifier.active,
      verifier.balance,
      verifier.shard
    );
  }

  function getNumberOfVerifiers() public view returns (uint) {
    return addresses.length;
  }

  function receiveApproval(address _from, uint256 _value, address _token, bytes memory _data) public returns (bool success) {
    Token token = Token(tokenAddress);

    uint256 allowance = token.allowance(_from, address(this));

    require(allowance > 0, "nothing to approve");

    require(token.transferFrom(_from, address(this), allowance), "transferFrom failed");

    verifiers[_from].balance += allowance;

    uint256 shard = verifiers[_from].shard;
    uint256 shardBalance = balancesPerShard[shard] + allowance;
    balancesPerShard[shard] = shardBalance;

    emit LogBalancePerShard(shard, shardBalance);

    return true;
  }

  function update(string memory _name, string memory _location) public {
    Verifier storage verifier = verifiers[msg.sender];

    require(verifier.id != address(0), "verifier do not exists");

    bytes32 hash = hashName(_name);
    bytes32 oldHash = hashName(verifier.name);
    require(hash == oldHash || !uniqueNames[hash], "specified name is not available");
    uniqueNames[oldHash] = false;
    uniqueNames[hash] = true;

    verifier.name = _name;
    verifier.location = _location;

    emit LogVerifierUpdated(
      verifier.id,
      verifier.name,
      verifier.location,
      verifier.active,
      verifier.balance,
      verifier.shard
    );
  }

  function withdraw(uint256 _value) public returns (bool) {
    Verifier storage verifier = verifiers[msg.sender];

    require(_value > 0 && verifier.balance >= _value, "nothing to withdraw");

    verifier.balance -= _value;

    uint256 shard = verifier.shard;
    uint256 shardBalance = balancesPerShard[shard] - _value;
    balancesPerShard[shard] = shardBalance;

    emit LogBalancePerShard(shard, shardBalance);

    Token token = Token(tokenAddress);

    require(token.transfer(msg.sender, _value), "transfer failed");

    return true;
  }

  function updateTokenAddress(address _newTokenAddress) public onlyOwner {
    require(_newTokenAddress != address(0), "empty token address");

    tokenAddress = _newTokenAddress;
  }

  function updateVerifiersPerShard(uint256 _newVerifiersPerShard) public onlyOwner {
    require(_newVerifiersPerShard > 0, "_newVerifiersPerShard is empty");

    verifiersPerShard = _newVerifiersPerShard;
  }

  function updateActiveStatus(address _verifierAddress, bool _active) public onlyOwner {
    Verifier storage verifier = verifiers[_verifierAddress];
    require(verifier.id != address(0), "verifier do not exists");
    require(verifier.active != _active, "no changes to active flag");

    verifier.active = _active;

    emit LogUpdateActiveStatus(msg.sender, _verifierAddress, _active);
  }

  function hashName(string memory _base) internal pure returns (bytes32) {
    bytes1 A = "A";
    bytes1 Z = "Z";

    bytes memory baseBytes = bytes(_base);
    for(uint i = 0; i < baseBytes.length; i++) {
      if ((baseBytes[i] >= A) && (baseBytes[i] <= Z)) {
        baseBytes[i] = bytes1(uint8(baseBytes[i]) + 32);
      }
    }
    return keccak256(abi.encodePacked(_base));
  }
}
