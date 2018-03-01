import duration from '../helpers/duration';
import latestTime from '../helpers/zeppelin/latestTime';
import assertRevert from '../helpers/zeppelin/assertRevert';
import ether from '../helpers/zeppelin/ether';

import {
    PolicyPalNetworkCrowdsale,
    PolicyPalNetworkToken,
    BigNumber,
    expect,
    TOTAL_SUPPLY,
    PREMINT_SUPPLY,
    PRESALE_SUPPLY,
    CROWDSALE_SUPPLY,
    RATE,
    MIN_CONTRIBUTION,
    MAX_CONTRIBUTION,
} from './params.js';

contract('Crowd Sale Creation', (accounts) => {
    /**
     * Test Variables
     */
    const crowdSaleCreator = accounts[0];
    const crowdSaleAdmin = accounts[1];
    const multisigWallet = accounts[2];
    const saleStartTime = latestTime() + duration.weeks(1); // Starts 1 week from now
    const saleEndTime = saleStartTime + duration.days(1);  // Ends in 1 day
    const increaseMaxContribTime = saleStartTime + duration.days(1); // Starts one day from start time
    let crowdSaleContract;
    let tokenContract;

    console.log('\n----------------- TEST PARAMS -----------------');
    console.log('Creator: ', crowdSaleCreator);
    console.log('Admin: ', crowdSaleAdmin);
    console.log('Total Supply: ', TOTAL_SUPPLY.toNumber());
    console.log('PreMint Supply: ', PREMINT_SUPPLY.toNumber());
    console.log('Presale Supply: ', PRESALE_SUPPLY.toNumber());
    console.log('Crowdsale Supply: ', CROWDSALE_SUPPLY.toNumber());
    console.log('Rate: ', RATE);
    console.log('Start Time: ', saleStartTime);
    console.log('End Time: ', saleEndTime);
    console.log('Increase Max Time: ', increaseMaxContribTime);
    console.log('-------------------------------------------------');

    /**
     * Test for Creation Failure
     */
    it('Create Crowdsale with Admin address 0x0 will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                0x0,
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
            )
        );
    });

    it('Create Crowdsale with Multisig Wallet address 0x0 will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                crowdSaleAdmin,
                0x0,
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
            )
        );
    });

    it('Create Crowdsale with 0 total supply will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                crowdSaleAdmin,
                multisigWallet,
                0,
                PREMINT_SUPPLY,
                PRESALE_SUPPLY,
                saleStartTime,
                saleEndTime,
                increaseMaxContribTime,
                RATE,
                MIN_CONTRIBUTION,
                MAX_CONTRIBUTION,
                { from: crowdSaleCreator }
            )
        );
    });

    it('Create Crowdsale with 0 premint supply will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                crowdSaleAdmin,
                multisigWallet,
                TOTAL_SUPPLY,
                0,
                PRESALE_SUPPLY,
                saleStartTime,
                saleEndTime,
                increaseMaxContribTime,
                RATE,
                MIN_CONTRIBUTION,
                MAX_CONTRIBUTION,
                { from: crowdSaleCreator }
            )
        );
    });

    it('Create Crowdsale with 0 premint supply will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                crowdSaleAdmin,
                multisigWallet,
                TOTAL_SUPPLY,
                PREMINT_SUPPLY,
                0,
                saleStartTime,
                saleEndTime,
                increaseMaxContribTime,
                RATE,
                MIN_CONTRIBUTION,
                MAX_CONTRIBUTION,
                { from: crowdSaleCreator }
            )
        );
    });

    it('Create Crowdsale with end date before start date will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                crowdSaleAdmin,
                multisigWallet,
                TOTAL_SUPPLY,
                PREMINT_SUPPLY,
                PRESALE_SUPPLY,
                saleEndTime,
                saleStartTime,
                increaseMaxContribTime,
                RATE,
                MIN_CONTRIBUTION,
                MAX_CONTRIBUTION,
                { from: crowdSaleCreator }
            )
        );
    });
    
    it('Create Crowdsale with increase max contrib time before start date will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                crowdSaleAdmin,
                multisigWallet,
                TOTAL_SUPPLY,
                PREMINT_SUPPLY,
                PRESALE_SUPPLY,
                saleStartTime,
                saleEndTime,
                saleStartTime - duration.seconds(1),
                RATE,
                MIN_CONTRIBUTION,
                MAX_CONTRIBUTION,
                { from: crowdSaleCreator }
            )
        );
    });

    it('Create Crowdsale with 0 rate will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
                crowdSaleAdmin,
                multisigWallet,
                TOTAL_SUPPLY,
                PREMINT_SUPPLY,
                PRESALE_SUPPLY,
                saleStartTime,
                saleEndTime,
                increaseMaxContribTime,
                0,
                MIN_CONTRIBUTION,
                MAX_CONTRIBUTION,
                { from: crowdSaleCreator }
            )
        );
    });

    it('Create Crowdsale with 0 maximum contributon will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
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
                0,
                { from: crowdSaleCreator }
            )
        );
    });

    it('Create Crowdsale with minimum contribution more than maximum will fail', () => {
        assertRevert(
            PolicyPalNetworkCrowdsale.new(
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
                1,
                { from: crowdSaleCreator }
            )
        );
    });

    it('-------------------------------------------------------------------------', () => {});

    /**
     * Test for Creation Success
     */
    it('Create Crowdsale', async() => {
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

        tokenContract = PolicyPalNetworkToken.at(await crowdSaleContract.token());

        expect(tokenContract).to.exist;
        expect(crowdSaleContract).to.exist;
    });

    it(`Token contract has correct total supply of ${TOTAL_SUPPLY}`, async() => {
        expect(await tokenContract.totalSupply()).to.be.bignumber.equal(TOTAL_SUPPLY);
    });

    it(`Token contract owner is admin (${crowdSaleAdmin})`, async() => {
        expect(await tokenContract.owner()).to.be.deep.equal(crowdSaleAdmin);
    });

    it(`Crowdsale has balance of ${CROWDSALE_SUPPLY/ether(1)}`, async() => {
        expect(await tokenContract.balanceOf(crowdSaleContract.address)).to.be.bignumber.equal(CROWDSALE_SUPPLY);
    });

    it(`Admin is ${crowdSaleAdmin}`, async() => {
        expect(await crowdSaleContract.admin()).to.be.deep.equal(crowdSaleAdmin);
     });

    it(`Admin has balance of ${PRESALE_SUPPLY/ether(1)}`, async() => {
        expect(await tokenContract.balanceOf(crowdSaleAdmin)).to.be.bignumber.equal(PRESALE_SUPPLY);
    });

    it(`Multisig wallet is ${multisigWallet}`, async() => {
       expect(await crowdSaleContract.multiSigWallet()).to.be.deep.equal(multisigWallet);
    });

    it(`Multisig has balance of ${PREMINT_SUPPLY/ether(1)}`, async() => {
        expect(await tokenContract.balanceOf(multisigWallet)).to.be.bignumber.equal(PREMINT_SUPPLY);
     });

    it(`Rate is ${RATE}`, async() => {
        expect(await crowdSaleContract.rate()).to.be.bignumber.equal(RATE);
     });

    it(`Sale Start Time is ${saleStartTime}`, async() => {
        expect(await crowdSaleContract.saleStartTime()).to.be.bignumber.equal(saleStartTime);
    });

    it(`Sale End Time is ${saleEndTime}`, async() => {
        expect(await crowdSaleContract.saleEndTime()).to.be.bignumber.equal(saleEndTime);
    });

    it(`Increase Max Contribution Time is ${increaseMaxContribTime}`, async() => {
        expect(await crowdSaleContract.increaseMaxContribTime()).to.be.bignumber.equal(increaseMaxContribTime);
    });

    it(`Minimum contribution is ${MIN_CONTRIBUTION/ether(1)}`, async() => {
        expect(await crowdSaleContract.minContribution()).to.be.bignumber.equal(MIN_CONTRIBUTION);
    });

    it(`Maximum contribution is ${MAX_CONTRIBUTION/ether(1)}`, async() => {
        expect(await crowdSaleContract.maxContribution()).to.be.bignumber.equal(MAX_CONTRIBUTION);
    });
});