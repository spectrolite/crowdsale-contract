import {
    BigNumber,
    expect,
    should,
} from '../standardParams';
import ether from '../helpers/zeppelin/ether';

/**
 * Test Crowdsale Import
 */
const PolicyPalNetworkCrowdsale = artifacts.require('PolicyPalNetworkCrowdsale');
const PolicyPalNetworkToken = artifacts.require('PolicyPalNetworkToken');

/**
 * Test Constants
 */
const TOTAL_SUPPLY = ether(1000000000);
const PREMINT_SUPPLY = ether(500000000);
const PRESALE_SUPPLY = ether(430087350);
const CROWDSALE_SUPPLY = ether(69912650);
const RATE = 21000;
const MIN_CONTRIBUTION = ether(0.1);
const MAX_CONTRIBUTION = ether(1);

module.exports = {
    PolicyPalNetworkCrowdsale,
    PolicyPalNetworkToken,
    BigNumber,
    expect,
    should,
    TOTAL_SUPPLY,
    PREMINT_SUPPLY,
    PRESALE_SUPPLY,
    CROWDSALE_SUPPLY,
    RATE,
    MIN_CONTRIBUTION,
    MAX_CONTRIBUTION,
}