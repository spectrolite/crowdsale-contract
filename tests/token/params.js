/**
 * Test Standard Imports
 */
import {
    BigNumber,
    expect,
} from '../standardParams';

/**
 * Test Token Import
 */
const PolicyPalNetworkToken = artifacts.require('PolicyPalNetworkToken');

/**
 * Test Constants
 */
const TOTAL_SUPPLY = web3.toWei(new BigNumber(1000000000), 'ether');
const TOKEN_NAME = 'PolicyPal Network Token';
const TOKEN_SYMBOL = 'PAL';
const TOKEN_DECIMALS = 18;

module.exports = {
    PolicyPalNetworkToken,
    BigNumber,
    expect,
    TOTAL_SUPPLY,
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
};
