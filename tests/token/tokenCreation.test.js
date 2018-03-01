import duration from '../helpers/duration';
import latestTime from '../helpers/zeppelin/latestTime';
import expectThrow from '../helpers/zeppelin/expectThrow';
import assertRevert from '../helpers/zeppelin/assertRevert';
import assertError from '../helpers/assertError';

import {
    PolicyPalNetworkToken,
    BigNumber,
    expect,
    TOTAL_SUPPLY,
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
} from './params.js';

contract('Token Creation', (accounts) => {
    /**
     * Test Variables
     */
    const tokenCreator = accounts[0];
    const tokenAdmin = accounts[1];
    let tokenContract;

    console.log('\n----------------- TEST PARAMS -----------------');
    console.log('Contract Token Name: ', TOKEN_NAME);
    console.log('Contract Token Symbol: ', TOKEN_SYMBOL);
    console.log('Contract Token Decimals: ', TOKEN_DECIMALS);
    console.log('Contract Token Creator: ', tokenCreator);
    console.log('Contract Token Admin: ', tokenAdmin);
    console.log('Contract Total Supply: ', TOTAL_SUPPLY.toNumber());
    console.log('-------------------------------------------------');

    /**
     * Create Contract and check contract
     */
    it('Create Contract', async() => {
        tokenContract = await PolicyPalNetworkToken.new(TOTAL_SUPPLY, tokenAdmin, { from: tokenCreator });
        expect(tokenContract).to.exist;
    });

    it(`Name is ${TOKEN_NAME}`, async() => {
        expect(await tokenContract.name()).to.deep.equal(TOKEN_NAME);
    });

    it(`Symbol is ${TOKEN_SYMBOL}`, async() => {
        expect(await tokenContract.symbol()).to.deep.equal(TOKEN_SYMBOL);
    });

    it(`Number of decimals is ${TOKEN_DECIMALS}`, async() => {
        expect(await tokenContract.decimals()).to.be.bignumber.equal(TOKEN_DECIMALS);
    });

    it('Token is by default not transferable', async() => {
      const contractTransferable = await tokenContract.isTokenTransferable();
        expect(contractTransferable).to.deep.equal(false);
    });

    it(`Total supply is ${TOTAL_SUPPLY.toNumber()}`, async() => {
        expect(await tokenContract.totalSupply()).to.be.bignumber.equal(TOTAL_SUPPLY);
    });

    it(`Contract Creator has supply of ${TOTAL_SUPPLY.toNumber()}`, async() => {
        const tokenCreatorSupply = await tokenContract.balanceOf(tokenCreator);
        expect(tokenCreatorSupply).to.be.bignumber.equal(TOTAL_SUPPLY);
    });

    it('Contract Admin has supply of 0', async() => {
        const tokenAdminSupply = await tokenContract.balanceOf(tokenAdmin);
        expect(tokenAdminSupply).to.be.bignumber.equal(new BigNumber(0));
    });

    it('Contract ownership is transfered to admin', async() => {
        const contractOwner = await tokenContract.owner();
        expect(contractOwner).to.be.deep.equal(tokenAdmin);
    });

    // if there's a lockin period post token sale
    it('Attempt to toggle token to be transferable by non-admin will fail', () => {
        assertRevert(tokenContract.toggleTransferable(true, { from: accounts[2] }));
    });

    it('Admin can toggle token to be transferable', async() => {
        await tokenContract.toggleTransferable(true, { from: tokenAdmin })
        expect(await tokenContract.isTokenTransferable()).to.be.equal(true);
    });
});
