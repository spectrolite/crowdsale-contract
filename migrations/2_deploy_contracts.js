var PolicyPalNetworkCrowdsale = artifacts.require("./PolicyPalNetworkCrowdsale.sol");

Date.prototype.getUnixTime = function() {
    return this.getTime()/1000|0;
};

if(!Date.now) {
    Date.now = function() {
        return new Date();
    }
}

Date.time = function() {
    return Date.now().getUnixTime();
}

module.exports = function(deployer) {
    const admin = "0xABC";
    const multisg = "0x123";
    const totalSupply = web3.toWei(1000000000, "ether");
    const premintedSupply = totalSupply / 2;
    const presaleSupply = web3.toWei(373989000, "ether");
    const startTime = new Date('Fri, 26 Feb 2018 8:30:00 GMT').getUnixTime();
    const endTime = new Date('Fri, 28 Feb 2018 8:30:00 GMT').getUnixTime();
    const increaseMaxContribTime = new Date('Fri, 27 Feb 2018 8:30:00 GMT').getUnixTime();
    const rate = 21000;
    const minContribution = web3.toWei(0.1, "ether");
    const maxContribution = web3.toWei(1, "ether");

    deployer.deploy(
        PolicyPalNetworkCrowdsale,
        admin,
        multisg,
        totalSupply,
        premintedSupply,
        presaleSupply,
        startTime,
        endTime,
        increaseMaxContribTime,
        rate,
        minContribution,
        maxContribution,
    );
}