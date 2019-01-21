# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased
### Added
* option to enable and disable verifier (`active` flag): 
  this will affect only voting process, disabled verifier can still withdraw etc.

### Changed
* checking if verifier is created is now done by checking if `id` is not empty

### Removed
* `created` field was removed from verifier structure

## [0.2.0] - 2018-12-12
### Added
- Makes verifiers per shard configurable
- Total token calculation per shard

## [0.1.0] - 2018-10-03
### Added
- Verifier registry
