const { fromAscii } = require('web3-utils');
const BigNumber = require('bignumber.js');

const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

const areAddressesEqual = (a, b) => {
  const aBN = BigNumber(typeof a === 'string' ? a.toLowerCase() : a);
  const bBN = BigNumber(typeof b === 'string' ? b.toLowerCase() : b);

  const result = aBN.eq(bBN);
  if (!result) {
    console.log('a:', aBN.toString(10));
    console.log('b:', bBN.toString(10));
  }
  return result;
};

const stringToBytes32 = (string) => {
  const bytes = fromAscii(string);
  return bytes + '0'.repeat(66 - bytes.length);
};

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

module.exports = {
  formatVerifier,
  stringToBytes32,
  areAddressesEqual,
  ZERO_ADDRESS,
};
