import assertError from '../helpers/assertError';
import assertRevert from '../helpers/zeppelin/assertRevert';
import latestTime from '../helpers/zeppelin/latestTime';
import duration from '../helpers/duration';
import { increaseTimeTo } from '../helpers/zeppelin/increaseTime';

import {
  PolicyPalNetworkToken,
  BigNumber,
  assert,
  expect,
  TOTAL_SUPPLY,
} from './params.js';

contract('Token Transfers', (accounts) => {
    /**
     * Test Variables
     */
    const tokenCreator = accounts[0];
    const tokenAdmin = accounts[1];
    const publicUserOne = accounts[2];
    const publicUserTwo = accounts[3];
    const publicUserThree = accounts[4];
    let tokenContract;

    before(async() => {
        // Assumption is made that the token creation works as per test in ./tokenCreation.tests.js
        // Spawn a new token contract before tests
        tokenContract = await PolicyPalNetworkToken.new(TOTAL_SUPPLY, tokenAdmin, { from: tokenCreator });
    });

    /**
     * Function Correctness Checks
     */
    it('transfer - To address 0x0 will fail', () => {
        const transferValue = new BigNumber(1);
        assertRevert(tokenContract.transfer(
            0x0,
            transferValue,
            { from: tokenAdmin },
        ));
    });

    it('transfer - To Token Contract address will fail', () => {
        const transferValue = new BigNumber(1);
        assertRevert(tokenContract.transfer(
            tokenContract.address,
            transferValue,
            { from: tokenCreator },
        ));
    });

    it('transfer - Amount more than balance will fail', () => {
        assertRevert(tokenContract.transfer(
            publicUserOne,
            new BigNumber(1),
            { from: tokenAdmin },
        ));
    });

    it('transfer - Amount less than balance will pass', async() => {
        const transferAmount = new BigNumber(88);
        await tokenContract.transfer(
            publicUserOne,
            transferAmount,
            { from: tokenCreator },
        );
        const userBalance = await tokenContract.balanceOf(publicUserOne);
        const creatorBalance = await tokenContract.balanceOf(tokenCreator);

        expect(userBalance).to.be.bignumber.equal(transferAmount);
        expect(creatorBalance).to.be.bignumber.equal(TOTAL_SUPPLY.minus(transferAmount));
    });

    it('approve - Return correct approved amount after approval', async() => {
        const approvalValue = new BigNumber(18);
        await tokenContract.approve(tokenAdmin, approvalValue, { from: tokenCreator });

        const approvedValue = await tokenContract.allowance(tokenCreator, tokenAdmin);
        expect(approvedValue).to.be.bignumber.equal(approvalValue);
    });

    it('transferFrom - To Address 0x0 will fail', async() => {
        const transferValue = new BigNumber(18);

        // Admin is authorized to spend Contract's token
        // This fails on the isValidDestination modifier
        assertRevert(tokenContract.transferFrom(
            tokenCreator,
            0x0,
            transferValue,
            { from: tokenAdmin },
        ));
    });

    it('transferFrom - To Token Contract address will fail', () => {
        const transferValue = new BigNumber(18);

        // Public User 2 is authorized to spend Public User 1's 18 token
        // This fails on the isValidDestination modifier
        assertRevert(tokenContract.transferFrom(
            tokenCreator,
            tokenContract.address,
            transferValue,
            { from: tokenAdmin },
        ));
    });


    it('transferFrom - Amount more than approved amount will fail', () => {
        const transferAmount = new BigNumber(99);

        // Public User 2 is authorized to spend Public User 1's 18 token
        // Trying to send 19 will fail
        assertRevert(tokenContract.transferFrom(
            tokenCreator,
            publicUserOne,
            transferAmount,
            { from: tokenAdmin },
        ));
    });

    it('transferFrom - Amount less than balance or equal approved amount will pass', async() => {
        const transferAmount = new BigNumber(18);
        const receiverPreBalance = await tokenContract.balanceOf(publicUserOne);
        const senderPreBalance = await tokenContract.balanceOf(tokenCreator);

        await tokenContract.transferFrom(
            tokenCreator,
            publicUserOne,
            transferAmount,
            { from: tokenAdmin },
        );
        const receiverBalance = await tokenContract.balanceOf(publicUserOne);
        const senderBalance = await tokenContract.balanceOf(tokenCreator);

        expect(receiverBalance).to.be.bignumber.equal(receiverPreBalance.add(transferAmount));
        expect(senderBalance).to.be.bignumber.equal(senderPreBalance.minus(transferAmount));
    });

    /**
     * Token Sale Checks
     */
    it('Create new contract & Start Token Sale', async() => {
        tokenContract = await PolicyPalNetworkToken.new(TOTAL_SUPPLY, tokenAdmin, { from: tokenCreator });
    });

    it('[TOKEN SALE] transfer - From creator to public user 1', async() => {
        const transferAmount = new BigNumber(168);
        await tokenContract.transfer(
            publicUserOne,
            transferAmount,
            { from: tokenCreator },
        );

        const userBalance = await tokenContract.balanceOf(publicUserOne);
        const creatorBalance = await tokenContract.balanceOf(tokenCreator);
        expect(userBalance).to.be.bignumber.equal(transferAmount);
        expect(creatorBalance).to.be.bignumber.equal(TOTAL_SUPPLY.minus(transferAmount));
    });

    it('[TOKEN SALE] transfer - From non-owner/admin will fail', () => {
        const transferAmount = new BigNumber(1);
            assertRevert(tokenContract.transfer(
            publicUserTwo,
            transferAmount,
            { from: publicUserOne },
        ));
    });

    it('[TOKEN SALE] transferFrom - Non-creator/admin will fail during sale', async() => {
        const approveAmount = new BigNumber(168);

        // assumption is approve works due to test above
        await tokenContract.approve(publicUserThree, approveAmount, { from: publicUserOne });
        assertRevert(tokenContract.transferFrom(
            publicUserOne,
            publicUserTwo,
            approveAmount,
            { from: publicUserOne },
        ));
    });

    /**
     * Post Token Sale (Transferrable) Checks
     */

    /**
     * [Before] Creator: TOTAL_SUPPLY - 168, PU1: 168
     * [After] Creator: TOTAL_SUPPLY - 238, PU1: 168, PU2: 88
     */
    it('[POST SALE] transfer - From creator to public user 2', async() => {
        const transferAmount = new BigNumber(88);
        await tokenContract.transfer(
            publicUserTwo,
            transferAmount,
            { from: tokenCreator },
        );

        const userBalance = await tokenContract.balanceOf(publicUserTwo);
        const creatorBalance = await tokenContract.balanceOf(tokenCreator);
        expect(userBalance).to.be.bignumber.equal(transferAmount);
        expect(creatorBalance).to.be.bignumber.equal(TOTAL_SUPPLY.minus(transferAmount.add(new BigNumber(168))));
    });

    /**
     * [Before] Creator: TOTAL_SUPPLY - 238, PU1: 168, PU2: 88
     * [After] Creator: TOTAL_SUPPLY - 238, PU1: 150, PU2: 108, PU3: 18
     */
    it('[POST SALE] transfer - Public User 1 to Public User 3 will fail due to isTokenTransferable = false', async() => {
        const transferAmount = new BigNumber(18);
        assertRevert(tokenContract.transfer(
            publicUserThree,
            transferAmount,
            { from: publicUserOne },
        ));
    });

    it('Enable transfers', async() => {
         // enable transfers
         await tokenContract.toggleTransferable(true, { from: tokenAdmin });
         expect(await tokenContract.isTokenTransferable()).to.be.equal(true);
    });

    /**
     * [Before] Creator: TOTAL_SUPPLY - 238, PU1: 168, PU2: 88
     * [After] Creator: TOTAL_SUPPLY - 238, PU1: 150, PU2: 108, PU3: 18
     */
    it('[POST SALE] transfer - Public User 1 to Public User 3 will pass due to isTokenTransferable = true', async() => {
        const transferAmount = new BigNumber(18);
        const senderPreBalance = await tokenContract.balanceOf(publicUserOne);

        await tokenContract.transfer(
        publicUserThree,
        transferAmount,
        { from: publicUserOne },
        );

        const receiverPostBalance = await tokenContract.balanceOf(publicUserThree);
        const senderPostBalance = await tokenContract.balanceOf(publicUserOne);
        expect(receiverPostBalance).to.be.bignumber.equal(transferAmount);
        expect(senderPostBalance).to.be.bignumber.equal(senderPreBalance.minus(transferAmount));
        expect(senderPostBalance).to.be.bignumber.equal(new BigNumber(150));
    });

    it('[POST SALE] transfer - More than balance will fail', () => {
        const transferAmount = new BigNumber(19);
        assertRevert(tokenContract.transfer(
        publicUserOne,
        transferAmount,
        { from: publicUserThree },
        ));
    });

    it('[POST SALE] transfer - To 0x0 will fail', () => {
        const transferAmount = new BigNumber(1);
        assertRevert(tokenContract.transfer(
        0x0,
        transferAmount,
        { from: publicUserThree },
        ));
    });

    it('[POST SALE] transfer - To Token Contract will fail', () => {
        const transferAmount = new BigNumber(1);
        assertRevert(tokenContract.transfer(
        tokenContract.address,
        transferAmount,
        { from: publicUserThree },
        ));
    });

    it('[POST SALE] approve - Approve more than balance will fail', () => {
        assertError(tokenContract.approve(
        publicUserTwo,
        new BigNumber(151),
        { from: publicUserOne },
        ));
    });

    it('[POST SALE] approve - Approve Public User 2 to 50 Public User 1 Tokens', async() => {
        const approveAmount = new BigNumber(50);
        await tokenContract.approve(
        publicUserTwo,
        approveAmount,
        { from: publicUserOne },
        );

        const allowedAmount = await tokenContract.allowance(publicUserOne, publicUserTwo);
        expect(allowedAmount).to.be.bignumber.equal(approveAmount);
    });

    it('[POST SALE] transferFrom - To 0x0 should fail', () => {
        const transferAmount = new BigNumber(1);
        assertRevert(tokenContract.transferFrom(
        publicUserOne,
        0x0,
        transferAmount,
        { from: publicUserTwo },
        ));
    });
    
    it('[POST SALE] transferFrom - To Token Contract should fail', () => {
        const transferAmount = new BigNumber(1);
        assertRevert(tokenContract.transferFrom(
        publicUserOne,
        tokenContract.address,
        transferAmount,
        { from: publicUserTwo },
        ));
    });

    /**
     * [BEFORE] Creator: TOTAL_SUPPLY - 238, PU1: 150, PU2: 108 (A: 50), PU3: 18
     * [AFTER]: Creator: TOTAL_SUPPLY - 238, PU1: 132, PU2: 108 (A: 32), PU3: 36
     */
    it('[POST SALE] transferFrom - Transfer 18 token of Public User 1 to Public User 3', async() => {
        const transferAmount = new BigNumber(18);
        const receiverPreBalance = await tokenContract.balanceOf(publicUserThree);
        const senderPreBalance = await tokenContract.balanceOf(publicUserOne);
        const allowedAmount = await tokenContract.allowance(publicUserOne, publicUserTwo);

        await tokenContract.transferFrom(
        publicUserOne,
        publicUserThree,
        transferAmount,
        { from: publicUserTwo },
        );

        const receiverPostBalance = await tokenContract.balanceOf(publicUserThree);
        const senderPostBalance = await tokenContract.balanceOf(publicUserOne);
        const allowedPostAmount = await tokenContract.allowance(publicUserOne, publicUserTwo);
        
        // Check for correct balance in receiver
        expect(receiverPostBalance).to.be.bignumber.equal(receiverPreBalance.add(transferAmount));
        expect(receiverPostBalance).to.be.bignumber.equal(new BigNumber(36)); // double check

        // Check for correct balance in sender
        expect(senderPostBalance).to.be.bignumber.equal(senderPreBalance.minus(transferAmount));
        expect(senderPostBalance).to.be.bignumber.equal(new BigNumber(132)); // double check

        // Check deduction in allowed amount of Public User 2
        expect(allowedPostAmount).to.be.bignumber.equal(allowedAmount.minus(transferAmount));
        expect(allowedPostAmount).to.be.bignumber.equal(new BigNumber(32)); // double check
    });
});
