pragma solidity ^0.4.18;

import './PolicyPalNetworkToken.sol';
import './CrowdsaleAuthorizer.sol';

/**
 * @title PPN Crowdsale
 * @dev Crowd Sale Contract
 */
contract PolicyPalNetworkCrowdsale is CrowdsaleAuthorizer {
    /**
    * @dev Token Crowd Sale Contract Public Variables
    */
    address                 public multiSigWallet;
    PolicyPalNetworkToken   public token;
    uint256                 public raisedWei;
    bool                    public haltSale;
    uint                    public rate;

    /**
    * @dev Modifier for valid sale
    */
    modifier validSale() {
      require(!haltSale);
      require(saleStarted());
      require(!saleEnded());
      _;
    }

    /**
     * @dev Buy Event
     */
    event Buy(address _buyer, uint256 _tokens, uint256 _payedWei);

    /**
     * @dev Token Crowd Sale Contract Constructor
     * @param _admin - Address of the Admin
     * @param _multiSigWallet - Address of Multisig wallet
     * @param _totalTokenSupply - Total Token Supply
     * @param _premintedTokenSupply - Total preminted token supply
     * @param _saleStartTime - The Start Time of the Token Sale
     * @param _saleEndTime - The End Time of the Token Sale
     * @param _increaseMaxContribTime - Time to increase max contribution
     * @param _rate - Rate of ETH to PAL
     * @param _minContribution - Minimum ETH contribution per contributor
     * @param _maxContribution - Maximum ETH contribution per contributor
     */
    function PolicyPalNetworkCrowdsale(
        address _admin,
        address _multiSigWallet,
        uint256 _totalTokenSupply,
        uint256 _premintedTokenSupply,
        uint256 _presaleTokenSupply,
        uint256 _saleStartTime,
        uint256 _saleEndTime,
        uint256 _increaseMaxContribTime,
        uint    _rate,
        uint256 _minContribution,
        uint256 _maxContribution
    )
    CrowdsaleAuthorizer(
        _admin,
        _saleStartTime,
        _saleEndTime,
        _increaseMaxContribTime,
        _minContribution,
        _maxContribution
    )
        validAddress(_multiSigWallet)
        public
    {
        require(_totalTokenSupply > 0);
        require(_premintedTokenSupply > 0);
        require(_presaleTokenSupply > 0);
        require(_rate > 0);
        
        require(_premintedTokenSupply < _totalTokenSupply);
        require(_presaleTokenSupply < _totalTokenSupply);

        multiSigWallet = _multiSigWallet;
        rate = _rate;

        token = new PolicyPalNetworkToken(
            _totalTokenSupply,
            _admin
        );

        // transfer preminted tokens to company wallet
        token.transfer(multiSigWallet, _premintedTokenSupply);
        // transfer presale tokens to admin
        token.transfer(_admin, _presaleTokenSupply);
    }

    /**
     * @dev Token Crowd Sale Contract Halter
     * @param _halt - Flag to halt sale
     */
    function setHaltSale(bool _halt)
        onlyAdmin
        public
    {
        haltSale = _halt;
    }

    /**
     * @dev Token Crowd Sale payable
     */
    function() public payable {
        buy(msg.sender);
    }

    /**
     * @dev Token Crowd Sale Buy
     * @param _recipient - Address of the recipient
     */
    function buy(address _recipient) public payable
        validSale
        validAddress(_recipient)
        returns(uint256)
    {
        // Get the contributor's eligible amount
        uint256 weiContributionAllowed = eligibleAmountCheck(_recipient, msg.value);
        require(weiContributionAllowed > 0);

        // Get tokens remaining for sale
        uint256 tokensRemaining = token.balanceOf(address(this));
        require(tokensRemaining > 0);

        // Get tokens that the contributor will receive
        uint256 receivedTokens = weiContributionAllowed.mul(rate);

        // Check remaining tokens
        // If lesser, update tokens to be transfer and contribution allowed
        if (receivedTokens > tokensRemaining) {
            receivedTokens = tokensRemaining;
            weiContributionAllowed = tokensRemaining.div(rate);
        }

        // Transfer tokens to contributor
        assert(token.transfer(_recipient, receivedTokens));

        // Send ETH payment to MultiSig Wallet
        sendETHToMultiSig(weiContributionAllowed);
        raisedWei = raisedWei.add(weiContributionAllowed);

        // Check weiContributionAllowed is larger than value sent
        // If larger, transfer the excess back to the contributor
        if (msg.value > weiContributionAllowed) {
            msg.sender.transfer(msg.value.sub(weiContributionAllowed));
        }

        // Broadcast event
        Buy(_recipient, receivedTokens, weiContributionAllowed);

        return weiContributionAllowed;
    }

    /**
     * @dev Token Crowd Sale Emergency Drain
     *      In case something went wrong and ETH is stuck in contract
     * @param _anyToken - Token to drain
     */
    function emergencyDrain(ERC20 _anyToken) public
        onlyAdmin
        returns(bool)
    {
        if (this.balance > 0) {
            sendETHToMultiSig(this.balance);
        }
        if (_anyToken != address(0x0)) {
            assert(_anyToken.transfer(multiSigWallet, _anyToken.balanceOf(this)));
        }
        return true;
    }

    /**
     * @dev Token Crowd Sale
     *      Transfer ETH to MultiSig Wallet
     * @param _value - Value of ETH to send
     */
    function sendETHToMultiSig(uint256 _value) internal {
        multiSigWallet.transfer(_value);
    }
}
