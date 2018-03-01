import latestTime from '../helpers/zeppelin/latestTime';
import duration from '../helpers/duration';
import assertError from '../helpers/assertError';

import {
    PolicyPalNetworkToken,
    BigNumber,
    assert,
    expect,
    TOTAL_SUPPLY,
} from './params.js';

contract('Token Burn', (accounts) => {
    /**
     * Test Variables
     */
    const tokenCreator = accounts[0];
    const tokenAdmin = accounts[1];
    const publicUserOne = accounts[2];
    let tokenContract;

    before(async() => {
        // Assumption is made that the token creation works as per test in ./tokenCreation.tests.js
        // Spawn a new token contract before tests
        tokenContract = await PolicyPalNetworkToken.new(TOTAL_SUPPLY, tokenAdmin, { from: tokenCreator });
    });

    it('Transfer tokens to owner before burn', async() => {
        const txAmt = new BigNumber(88);
        await tokenContract.transfer(
            tokenAdmin,
            txAmt,
            { from: tokenCreator },
        );
        expect(await tokenContract.balanceOf(tokenAdmin)).to.be.bignumber.equal(txAmt);
    });

    it('Transfer tokens to public user one before burn', async() => {
        const txAmt = new BigNumber(138);
        await tokenContract.transfer(
            publicUserOne,
            txAmt,
            { from: tokenCreator },
        );
        expect(await tokenContract.balanceOf(publicUserOne)).to.be.bignumber.equal(txAmt);
    });

    it('Burn more than available tokens will fail', () => {
        const burnAmount = new BigNumber(89);
        assertError(tokenContract.burn(burnAmount, { from: tokenAdmin }));
    });

    it('Burn 18 tokens of total supply by Token Admin', async() => {
        const burnAmount = new BigNumber(88);
        const expectedTotalSupply = TOTAL_SUPPLY.minus(burnAmount);

        // Admin burn 18 tokens
        await tokenContract.burn(burnAmount, { from: tokenAdmin });

        const newTotalSupply = await tokenContract.totalSupply();
        const newAdminBalance = await tokenContract.balanceOf(tokenAdmin);

        // Check against `TOTAL_SUPPLY - burnAmount`
        // Double-check against hardcoded defined `expectedTotalSupply` of 0
        expect(newTotalSupply).to.be.bignumber.equal(expectedTotalSupply);
        expect(newAdminBalance).to.be.bignumber.equal(0);
    });

    it('Burn 138 tokens of total supply by public user one', async() => {
        const burnAmount = new BigNumber(138);
        const burnAmountToTest = new BigNumber(226);
        const expectedTotalSupply = TOTAL_SUPPLY.minus(burnAmountToTest);

        await tokenContract.burn(burnAmount, { from: publicUserOne });

        const newTotalSupply = await tokenContract.totalSupply();
        const newPUOneBalance = await tokenContract.balanceOf(publicUserOne);

        // Check against `TOTAL_SUPPLY - burnAmount`
        // Double-check against hardcoded defined `expectedTotalSupply` of 0
        expect(newTotalSupply).to.be.bignumber.equal(expectedTotalSupply);
        expect(newPUOneBalance).to.be.bignumber.equal(0);
    });
});