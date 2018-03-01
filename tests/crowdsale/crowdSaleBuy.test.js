import duration from '../helpers/duration';
import latestTime from '../helpers/zeppelin/latestTime';
import { increaseTimeTo } from '../helpers/zeppelin/increaseTime';
import assertRevert from '../helpers/zeppelin/assertRevert';
import assertError from '../helpers/assertError';
import ether from '../helpers/zeppelin/ether';

import {
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
} from './params.js';

contract('Crowd Sale Buy', (accounts) => {
    const crowdSaleCreator = accounts[0];
    const crowdSaleAdmin = accounts[1];
    const multisigWallet = accounts[2];
    const publicUserOne = accounts[3];
    const publicUserTwo = accounts[4];
    const publicUserThree = accounts[5];
    const publicUserFour = accounts[6];
    const saleStartTime = latestTime() + duration.weeks(1); // Starts 1 week from now
    const saleEndTime = saleStartTime + duration.days(3);  // Ends in 3 day
    const increaseMaxContribTime = saleStartTime + duration.days(1); // Starts 1 day from now
    let crowdSaleContract;
    let tokenContract;

    before(async() => {
        crowdSaleContract = await PolicyPalNetworkCrowdsale.new(
            crowdSaleAdmin,
            multisigWallet,
            TOTAL_SUPPLY,
            PREMINT_SUPPLY,
            PRESALE_SUPPLY,
            saleStartTime,
            saleEndTime,
            increaseMaxContribTime,
            RATE,
            MIN_CONTRIBUTION,
            MAX_CONTRIBUTION,
            { from: crowdSaleCreator }
        );
        tokenContract = await PolicyPalNetworkToken.at(await crowdSaleContract.token());
    });

    it('Buy before sale will fail', () => {
        assertRevert(crowdSaleContract.buy(publicUserOne,
            {
                from: publicUserOne,
                value: ether(0.1),
            },
        ));
    });

    describe('Start Crowd Sale', () => {
        before(async() => {
            await increaseTimeTo(saleStartTime);
        });

        it('Buy without whitelist will fail', () => {
            assertRevert(crowdSaleContract.buy(
                publicUserOne,
                {
                    from: publicUserOne,
                    value: ether(1),
                },
            ));
        });

        it('Whitelist Public User One by Non-Admin will fail', () => {
            assertError(crowdSaleContract.updateWhitelist(
                publicUserOne,
                true,
                { from: publicUserTwo },
            ));
        });

        it('Whitelist Multiple by Non-Admin will fail', () => {
            assertRevert(crowdSaleContract.updateWhitelists(
                [publicUserTwo, publicUserThree],
                [true, true],
                { from: publicUserTwo },
            ));
        });

        it('Whitelist Public User One by Admin', async() => {
            await crowdSaleContract.updateWhitelist(
                publicUserOne,
                true,
                { from: crowdSaleAdmin },
            );

            const whitelistStatus = await crowdSaleContract.whitelistAddresses(publicUserOne);
            expect(whitelistStatus).to.be.equal(true);
        });

        it('Whitelist Multiple Users by Admin', async() => {
            await crowdSaleContract.updateWhitelists(
                [publicUserTwo, publicUserThree, publicUserFour],
                [true, true, true],
                { from: crowdSaleAdmin },
            );

            const whitelistStatusPU2 = await crowdSaleContract.whitelistAddresses(publicUserTwo);
            const whitelistStatusPU3 = await crowdSaleContract.whitelistAddresses(publicUserThree);
            expect(whitelistStatusPU2).to.be.equal(true);
            expect(whitelistStatusPU3).to.be.equal(true);
        });

        it(`Check eligbible amount below minimum contribution (< ${MIN_CONTRIBUTION/ether(1)}ETH) will be 0`, async() => {
            const contributionAmt = ether(0.01);
            const eligibleAmt = await crowdSaleContract.eligibleAmount(publicUserOne, contributionAmt);
            expect(eligibleAmt).to.be.bignumber.equal(0);
        });

        it(`Check eligbible amount within contribution (${MAX_CONTRIBUTION/2/ether(1)}ETH)`, async() => {
            const contributionAmt = ether(0.5);
            const eligibleAmt = await crowdSaleContract.eligibleAmount(publicUserOne, contributionAmt);
            expect(eligibleAmt).to.be.bignumber.equal(contributionAmt);
        });

        it(`Check eligbible amount for user more than contribution (${MAX_CONTRIBUTION/ether(1)}ETH) will be max`, async() => {
            const contributionAmt = ether(4);
            const eligibleAmt = await crowdSaleContract.eligibleAmount(publicUserOne, contributionAmt);
            expect(eligibleAmt).to.be.bignumber.equal(ether(1));
        });

        it('Buy below minimum contribution (< 0.1ETH) will fail', () => {
            assertRevert(crowdSaleContract.buy(publicUserOne,
                {
                    from: publicUserOne,
                    value: ether(0.09),
                },
            ));
        });

        it(`Public User 1 buy half of max contribution (${MAX_CONTRIBUTION/2/ether(1)}ETH)`, async() => {
            const walletPreBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPreBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            const txAmount = (MAX_CONTRIBUTION / 2);
            const expectedTokenAmount = txAmount * RATE;

            await crowdSaleContract.buy(publicUserOne,
                {
                    from: publicUserOne,
                    value: txAmount,
                },
            );

            const walletPostBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPostBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            expect(await tokenContract.balanceOf(publicUserOne)).to.be.bignumber.equal(expectedTokenAmount);
            expect(crowdSaleTokenPostBalance).to.be.bignumber.equal(crowdSaleTokenPreBalance.minus(expectedTokenAmount));
            expect(walletPostBalance).to.be.bignumber.equal(walletPreBalance.add(txAmount));
        });

        it(`Public User 1 buy remaining half of max contribution (${MAX_CONTRIBUTION/2/ether(1)}ETH)`, async() => {
            const walletPreBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPreBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            const txAmount = (MAX_CONTRIBUTION / 2);
            const txTokenAmount = txAmount * RATE;
            const expectedUserTokenAmount = MAX_CONTRIBUTION * RATE;

            await crowdSaleContract.buy(publicUserOne,
                {
                    from: publicUserOne,
                    value: txAmount,
                },
            );

            const walletPostBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPostBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            expect(await tokenContract.balanceOf(publicUserOne)).to.be.bignumber.equal(expectedUserTokenAmount);
            expect(crowdSaleTokenPostBalance).to.be.bignumber.equal(crowdSaleTokenPreBalance.minus(txTokenAmount));
            expect(walletPostBalance).to.be.bignumber.equal(walletPreBalance.add(txAmount));
        });

        it('Public User 1 buy more than max contribution will fail', () => {
            const txAmount = MIN_CONTRIBUTION
            assertRevert(crowdSaleContract.buy(publicUserOne,
                {
                    from: publicUserOne,
                    value: txAmount,
                },
            ));
        });

        it(`Public User 2 buy > ${MAX_CONTRIBUTION/ether(1)}ETH, will be capped at ${MAX_CONTRIBUTION/ether(1)}ETH`, async() => {
            const walletPreBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPreBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            const allowedAmount = MAX_CONTRIBUTION;
            const txAmount = ether(1.1);
            const expectedTokenAmount = allowedAmount * RATE;

            await crowdSaleContract.buy(publicUserTwo,
                {
                    from: publicUserTwo,
                    value: txAmount,
                },
            );

            const walletPostBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPostBalance = await tokenContract.balanceOf(crowdSaleContract.address);
            const userTokenBalance = await tokenContract.balanceOf(publicUserTwo);

            expect(userTokenBalance).to.be.bignumber.equal(expectedTokenAmount);
            expect(crowdSaleTokenPostBalance).to.be.bignumber.equal(crowdSaleTokenPreBalance.minus(expectedTokenAmount));
            expect(walletPostBalance).to.be.bignumber.equal(walletPreBalance.add(MAX_CONTRIBUTION));
        });

        it('Admin halt sales', async() => {
            await crowdSaleContract.setHaltSale(true, { from: crowdSaleAdmin });
            expect(await crowdSaleContract.haltSale()).to.be.equal(true);
        });

        it('Public User 3 buy when sale is halt will fail', () => {
            const txAmount = MIN_CONTRIBUTION;
            assertRevert(crowdSaleContract.buy(publicUserThree,
                {
                    from: publicUserThree,
                    value: txAmount,
                },
            ));
        });

        it('Public User 3 buy when after sale is unhalt', async() => {
            const walletPreBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPreBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            await crowdSaleContract.setHaltSale(false, { from: crowdSaleAdmin });

            const txAmount = MIN_CONTRIBUTION;
            const expectedTokenAmount = txAmount * RATE;
            await crowdSaleContract.buy(publicUserThree,
                {
                    from: publicUserThree,
                    value: txAmount,
                },
            );

            const walletPostBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPostBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            expect(await tokenContract.balanceOf(publicUserThree)).to.be.bignumber.equal(expectedTokenAmount);
            expect(crowdSaleTokenPostBalance).to.be.bignumber.equal(crowdSaleTokenPreBalance.minus(expectedTokenAmount));
            expect(walletPostBalance).to.be.bignumber.equal(walletPreBalance.add(txAmount));
        });

        it('Fast forward 1 day to unlock max contribution', async() => {
            await increaseTimeTo(increaseMaxContribTime);
        });

        it('Public User 3 buy after max contribution is unlocked', async() => {
            const walletPreBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPreBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            const txAmount = ether(10);
            const expectedTokenAmount = txAmount * RATE;
            const actualTxTokenAmount = (txAmount - MIN_CONTRIBUTION) * RATE;
            await crowdSaleContract.buy(publicUserThree,
                {
                    from: publicUserThree,
                    value: txAmount,
                },
            );

            const walletPostBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPostBalance = await tokenContract.balanceOf(crowdSaleContract.address);
            const pu3TokenBalance = await tokenContract.balanceOf(publicUserThree);

            expect(pu3TokenBalance).to.be.bignumber.equal(expectedTokenAmount);
            expect(crowdSaleTokenPostBalance).to.be.bignumber.equal(crowdSaleTokenPreBalance.minus(actualTxTokenAmount));
            expect(walletPostBalance).to.be.bignumber.equal(walletPreBalance.add(txAmount - MIN_CONTRIBUTION));
        });

        it('Public User 4 buys 10 ether (new maximum cap)', async() => {
            const walletPreBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPreBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            const txAmount = ether(10);
            const expectedTokenAmount = txAmount * RATE;
            await crowdSaleContract.buy(publicUserFour,
                {
                    from: publicUserFour,
                    value: txAmount,
                },
            );

            const walletPostBalance = await web3.eth.getBalance(multisigWallet);
            const crowdSaleTokenPostBalance = await tokenContract.balanceOf(crowdSaleContract.address);

            expect(await tokenContract.balanceOf(publicUserFour)).to.be.bignumber.equal(expectedTokenAmount);
            expect(crowdSaleTokenPostBalance).to.be.bignumber.equal(crowdSaleTokenPreBalance.minus(expectedTokenAmount));
            expect(walletPostBalance).to.be.bignumber.equal(walletPreBalance.add(txAmount));
        });

        it('Public User 4 more than new maximum cap will fail', async() => {
            const txAmount = MIN_CONTRIBUTION;
            assertRevert(crowdSaleContract.buy(publicUserFour,
                {
                    from: publicUserFour,
                    value: txAmount,
                },
            ));
        });
    });

    describe('End Crowd Sale', () => {
        before(async() => {
            await increaseTimeTo(saleEndTime);
        });

        it('Public User 3 buy after crowd sale will fail', () => {
            const txAmount = MIN_CONTRIBUTION;
            assertError(crowdSaleContract.buy(publicUserThree,
                {
                    from: publicUserThree,
                    value: txAmount,
                },
            ));
        });
    });
});