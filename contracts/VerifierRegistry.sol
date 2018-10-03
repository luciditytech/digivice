pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'token-sale-contracts/contracts/Token.sol';
import 'token-sale-contracts/contracts/HumanStandardToken.sol';

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

  struct Verifier {
    address id;
    string location;
    bool created;
    uint256 balance;
    uint256 shard;
  }

  mapping(address => Verifier) public verifiers;

  address[] public addresses;
  address public tokenAddress;
  uint256 public verifiersPerShard = 3;

  function VerifierRegistry(address _tokenAddress) {
    tokenAddress = _tokenAddress;
  }

  function create(string _location) public {
    Verifier storage verifier = verifiers[msg.sender];

    require(!verifier.created);

    verifier.id = msg.sender;
    verifier.location = _location;
    verifier.created = true;
    verifier.shard = uint256(addresses.length) / verifiersPerShard;

    addresses.push(verifier.id);

    LogVerifierRegistered(
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

    require(allowance > 0);

    require(token.transferFrom(_from, this, allowance));

    verifiers[_from].balance += allowance;

    return true;
  }

  function update(string _location) public {
    Verifier storage verifier = verifiers[msg.sender];

    require(verifier.created);

    verifier.location = _location;

    LogVerifierUpdated(
      verifier.id,
      verifier.location,
      verifier.created,
      verifier.balance,
      verifier.shard
    );
  }

  function withdraw(uint256 _value) public returns (bool success) {
    Verifier storage verifier = verifiers[msg.sender];

    require(_value > 0 && verifier.balance >= _value);

    verifier.balance -= _value;

    Token token = Token(tokenAddress);

    require(token.transfer(msg.sender, _value));

    return true;
  }

  function updateTokenAddress(address _newTokenAddress) public onlyOwner {
    require(_newTokenAddress != address(0));

    tokenAddress = _newTokenAddress;
  }

  function updateVerifiersPerShard(uint256 _newVerifiersPerShard) public onlyOwner {
    require(_newVerifiersPerShard > 0);

    verifiersPerShard = _newVerifiersPerShard;
  }
}
