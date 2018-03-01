import assertRevert from '../helpers/zeppelin/assertRevert';
import latestTime from '../helpers/zeppelin/latestTime';
import duration from '../helpers/duration';

import {
    PolicyPalNetworkToken,
    BigNumber,
    expect,
    TOTAL_SUPPLY,
} from './params.js';

contract('Token Drain', (accounts) => {
    /**
     * Test Variables
     */
    const tokenCreator = accounts[0];
    const tokenAdmin = accounts[1];
    const publicUserOne = accounts[2];
    let tokenContract;
    let erc20TokenContract;
    
    before(async() => {
        // Assumption is made that the token creation works as per test in ./tokenCreation.tests.js
        // Spawn a new token contract before tests
        tokenContract = await PolicyPalNetworkToken.new(TOTAL_SUPPLY, tokenAdmin, { from: tokenCreator });
        // create ERC20 token contract
        erc20TokenContract = await PolicyPalNetworkToken.new(TOTAL_SUPPLY, tokenAdmin, { from: publicUserOne });
    });

    it('Transfer from ERC20 Contract to Token Contract', async() => {
        const transferAmount = new BigNumber(18);

        // Transfer from ERC20 to token contract
        await erc20TokenContract.transfer(
            tokenContract.address,
            transferAmount,
            { from: publicUserOne },
        );

        const tokenContractBalInErc = await erc20TokenContract.balanceOf(tokenContract.address);
        expect(tokenContractBalInErc).to.be.bignumber.equal(transferAmount);
    })

    it('emergencyERC20Drain - Non owner will fail', () => {
        const drainAmount = new BigNumber(1);
        assertRevert(tokenContract.emergencyERC20Drain(
            erc20TokenContract.address,
            drainAmount,
            { from: tokenCreator },
        ));
    });

    it('emergencyERC20Drain - Drain from owner', async() => {
        const drainAmount = new BigNumber(18);
        await tokenContract.emergencyERC20Drain(
            erc20TokenContract.address,
            drainAmount,
            { from: tokenAdmin },
        );
        const adminBalInErc = await erc20TokenContract.balanceOf(tokenContract.address);
        expect(adminBalInErc).to.be.bignumber.equal(0);
    });
});