const BigNumber = web3.BigNumber;

const chai = require('chai')
              .use(require('chai-as-promised'))
              .use(require('chai-bignumber')(BigNumber))
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

module.exports = {
    BigNumber,
    should,
    expect,
    assert,
};
