pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "token-sale-contracts/contracts/Token.sol";
import "token-sale-contracts/contracts/HumanStandardToken.sol";

contract VerifierRegistry is Ownable {
  event LogVerifierRegistered(
    address id,
    string location,
    bool created,
    uint256 balance,
    uint256 shard
  );

  event LogVerifierUpdated(
    address id,
    string location,
    bool created,
    uint256 balance,
    uint256 shard
  );

  event LogBalancePerShard(uint256 shard, uint256 balance);

  struct Verifier {
    address id;
    string location;
    bool created;
    uint256 balance;
    uint256 shard;
  }

  mapping(address => Verifier) public verifiers;

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

  function create(string _location) public {
    Verifier storage verifier = verifiers[msg.sender];

    require(!verifier.created, "verifier already exists");

    verifier.id = msg.sender;
    verifier.location = _location;
    verifier.created = true;
    verifier.shard = uint256(addresses.length) / verifiersPerShard;

    addresses.push(verifier.id);

    emit LogVerifierRegistered(
      verifier.id,
      verifier.location,
      verifier.created,
      verifier.balance,
      verifier.shard
    );
  }

  function getNumberOfVerifiers() public view returns (uint) {
    return addresses.length;
  }

  function receiveApproval(address _from, uint256 _value, address _token, bytes _data) public returns (bool success) {
    Token token = Token(tokenAddress);

    uint256 allowance = token.allowance(_from, this);

    require(allowance > 0, "nothing to approve");

    require(token.transferFrom(_from, this, allowance), "transferFrom failed");

    verifiers[_from].balance += allowance;

    uint256 shard = verifiers[_from].shard;
    uint256 shardBalance = balancesPerShard[shard] + allowance;
    balancesPerShard[shard] = shardBalance;

    emit LogBalancePerShard(shard, shardBalance);

    return true;
  }

  function update(string _location) public {
    Verifier storage verifier = verifiers[msg.sender];

    require(verifier.created, "verifier do not exists");

    verifier.location = _location;

    emit LogVerifierUpdated(
      verifier.id,
      verifier.location,
      verifier.created,
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
}
