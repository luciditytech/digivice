pragma solidity 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "contract-registry/contracts/interfaces/IContractRegistry.sol";
import "contract-registry/contracts/storage/interfaces/IStorageBase.sol";
import "contract-registry/contracts/storageStrategy/interfaces/IStorageStrategy.sol";
import "contract-registry/contracts/interfaces/RegistrableWithSingleStorage.sol";
import "staking-bank/contracts/interfaces/IStakingBank.sol";

import "./interfaces/IVerifierRegistry.sol";
import "./VerifierRegistryStorage.sol";

contract VerifierRegistry is IVerifierRegistry, Ownable, RegistrableWithSingleStorage {

  using SafeMath for uint256;

  bytes32 constant NAME = "VerifierRegistry";

  event LogVerifierRegistered(
    address id,
    string name,
    string location,
    bool active,
    uint256 balance,
    uint256 shard,
    bool enable
  );

  event LogVerifierUpdated(
    address id,
    string name,
    string location,
    bool active,
    uint256 balance,
    uint256 shard,
    bool enable
  );

  event LogBalancePerShard(uint256 shard, uint256 balance);

  event LogUpdateActiveStatus(address verifier, bool active);
  event LogUpdateEnableStatus(address executor, address verifier, bool enable);

  constructor(address _registry, IStorageBase _storage)
  public
  RegistrableWithSingleStorage(_registry, _storage) {}

  function contractName() external view returns (bytes32) {
    return NAME;
  }

  function _storage() private view returns (VerifierRegistryStorage) {
    return VerifierRegistryStorage(address(singleStorage));
  }

  function _getStakingBalance(address _verifier) private view returns (uint256) {
    bool enable;
    bool active;
    (enable, active) = _storage().getVerifierEnableActive(_verifier);

    if (!enable || !active) return 0;

    IStakingBank bank = IStakingBank(contractRegistry.contractByName("StakingBank"));
    require(address(bank) != address(0x0), "StakingBank address unknown");

    return bank.stakingBalance(_verifier);
  }

  function create(string memory _name, string memory _location) public {
    VerifierRegistryStorage vrStorage = _storage();
    VerifierRegistryStorage.Verifier memory verifier;
    (verifier.id, verifier.name, verifier.location, verifier.active, verifier.shard, verifier.enable) = vrStorage.verifiers(msg.sender);

    require(verifier.id == address(0x0), "verifier already exists");

    bytes32 hash = hashName(_name);
    require(!vrStorage.uniqueNames(hash), "specified name is not available");
    vrStorage.setUniqueNames(hash, true);

    verifier.id = msg.sender;
    verifier.name = _name;
    verifier.location = _location;
    verifier.shard = uint256(vrStorage.addressesLength()) / vrStorage.verifiersPerShard();

    vrStorage.setVerifier(
      verifier.id,
      verifier.name,
      verifier.location,
      verifier.active,
      verifier.shard,
      verifier.enable
    );

    vrStorage.addressesPush(verifier.id);

    emit LogVerifierRegistered(
      verifier.id,
      verifier.name,
      verifier.location,
      verifier.active,
      _getStakingBalance(verifier.id),
      verifier.shard,
      verifier.enable
    );
  }

  function getNumberOfVerifiers() public view returns (uint256) {
    return _storage().addressesLength();
  }

  function update(string memory _name, string memory _location) public {
    VerifierRegistryStorage vrStorage = _storage();
    VerifierRegistryStorage.Verifier memory verifier;
    (verifier.id, verifier.name, verifier.location, verifier.active, verifier.shard, verifier.enable) = vrStorage.verifiers(msg.sender);

    require(verifier.id != address(0x0), "verifier do not exists");

    bytes32 hash = hashName(_name);
    bytes32 oldHash = hashName(verifier.name);

    require(hash == oldHash || !vrStorage.uniqueNames(hash), "specified name is not available");
    vrStorage.setUniqueNames(oldHash, false);
    vrStorage.setUniqueNames(hash, true);

    verifier.name = _name;
    verifier.location = _location;

    vrStorage.setVerifier(
      verifier.id,
      verifier.name,
      verifier.location,
      verifier.active,
      verifier.shard,
      verifier.enable
    );

    emit LogVerifierUpdated(
      verifier.id,
      verifier.name,
      verifier.location,
      verifier.active,
      _getStakingBalance(verifier.id),
      verifier.shard,
      verifier.enable
    );
  }

  function updateVerifiersPerShard(uint256 _newVerifiersPerShard) public onlyOwner {
    require(_newVerifiersPerShard > 0, "_newVerifiersPerShard is empty");
    _storage().setVerifiersPerShard(_newVerifiersPerShard);
  }

  function updateActiveStatus(bool _active) external {
    VerifierRegistryStorage vrStorage = _storage();
    VerifierRegistryStorage.Verifier memory verifier;
    (verifier.id, , , verifier.active, ,verifier.enable) = vrStorage.verifiers(msg.sender);

    require(verifier.id != address(0x0), "verifier do not exists");
    require(verifier.active != _active, "no changes to active flag");

    vrStorage.setVerifierActive(msg.sender, _active);

    _updateBalancePerShard(msg.sender, _active && verifier.enable ? _getStakingBalance(msg.sender) : 0);

    emit LogUpdateActiveStatus(msg.sender, _active);
  }

  function updateEnableStatus(address _verifier, bool _enable) public onlyOwner {
    VerifierRegistryStorage vrStorage = _storage();
    VerifierRegistryStorage.Verifier memory verifier;
    (verifier.id, , ,verifier.active, ,verifier.enable) = vrStorage.verifiers(_verifier);

    require(verifier.id != address(0x0), "verifier do not exists");
    require(verifier.enable != _enable, "no changes to enable flag");

    vrStorage.setVerifierEnable(_verifier, _enable);

    _updateBalancePerShard(_verifier, _enable && verifier.active ? _getStakingBalance(_verifier) : 0);

    emit LogUpdateEnableStatus(msg.sender, _verifier, _enable);
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

  function verifiers(address _verifier) external view returns (
    address id,
    string memory name,
    string memory location,
    bool active,
    uint256 balance,
    uint256 shard,
    bool enable
  ) {
    VerifierRegistryStorage.Verifier memory verifier;
    (verifier.id, verifier.name, verifier.location, verifier.active, verifier.shard, verifier.enable) = _storage().verifiers(_verifier);

    return (
      verifier.id,
      verifier.name,
      verifier.location,
      verifier.active,
      _getStakingBalance(verifier.id),
      verifier.shard,
      verifier.enable
    );
  }

  function uniqueNames(bytes32 _hash) external view returns (bool) {
    return _storage().uniqueNames(_hash);
  }

  function balancesPerShard(uint256 _shard) external view returns (uint256) {
    return _storage().balancesPerShard(_shard);
  }

  function addresses(uint256 _i) external view returns (address) {
    return _storage().addresses(_i);
  }

  function verifiersPerShard() external view returns (uint256) {
    return _storage().verifiersPerShard();
  }

  function isRegisteredVerifier(address _toCheck) external view returns (bool) {
    address id;
    (id, , , , , ) = _storage().verifiers(_toCheck);
    return id != address(0x0);
  }

  function _updateBalancePerShard(address _verifier, uint256 _newBalance)
  private {
    VerifierRegistryStorage vrStorage = _storage();

    uint256 shard = vrStorage.getVerifierShard(_verifier);
    uint256 verifierOldBalance = _getStakingBalance(_verifier);
    uint256 newShardBalance = vrStorage.balancesPerShard(shard).sub(verifierOldBalance).add(_newBalance);

    vrStorage.setBalancePerShard(shard, newShardBalance);

    emit LogBalancePerShard(shard, newShardBalance);
  }

  function increaseShardBalance(address _verifier, uint256 _amount)
  external
  onlyFromContract("StakingBank")
  returns (bool) {
    VerifierRegistryStorage vrStorage = _storage();

    address id;
    uint256 shard;
    (id, , , , shard, ) = _storage().verifiers(_verifier);
    require(id != address(0x0), "verifier not exists");

    vrStorage.setBalancePerShard(shard, vrStorage.balancesPerShard(shard).add(_amount));
    return true;
  }

  function decreaseShardBalance(address _verifier, uint256 _amount)
  external
  onlyFromContract("StakingBank")
  returns (bool) {
    VerifierRegistryStorage vrStorage = _storage();

    address id;
    uint256 shard;
    (id, , , , shard, ) = _storage().verifiers(_verifier);
    require(id != address(0x0), "verifier not exists");

    vrStorage.setBalancePerShard(shard, vrStorage.balancesPerShard(shard).sub(_amount));
    return true;
  }
}
