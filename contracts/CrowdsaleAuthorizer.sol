pragma solidity ^0.4.18;

import './zeppelin/math/SafeMath.sol';

/**
 * @title CrowdsaleAuthorizer
 * @dev Crowd Sale Authorizer
 */
contract CrowdsaleAuthorizer {
    mapping(address => uint256)    public participated;
    mapping(address => bool)       public whitelistAddresses;

    address                        public admin;
    uint256                        public saleStartTime;
    uint256                        public saleEndTime;
    uint256                        public increaseMaxContribTime;
    uint256                        public minContribution;
    uint256                        public maxContribution;

    using SafeMath for uint256;

    /**
    * @dev Modifier for only admin
    */
    modifier onlyAdmin() {
      require(msg.sender == admin);
      _;
    }

    /**
    * @dev Modifier for valid address
    */
    modifier validAddress(address _addr) {
      require(_addr != address(0x0));
      require(_addr != address(this));
      _;
    }

    /**
     * @dev Contract Constructor
     * @param _saleStartTime - The Start Time of the Token Sale
     * @param _saleEndTime - The End Time of the Token Sale
     * @param _increaseMaxContribTime - Time to increase Max Contribution of the Token Sale
     * @param _minContribution - Minimum ETH contribution per contributor
     * @param _maxContribution - Maximum ETH contribution per contributor
     */
    function CrowdsaleAuthorizer(
        address _admin,
        uint256 _saleStartTime,
        uint256 _saleEndTime,
        uint256 _increaseMaxContribTime,
        uint256 _minContribution,
        uint256 _maxContribution
    )
        validAddress(_admin)
        public
    {
        require(_saleStartTime > now);
        require(_saleEndTime > now);
        require(_increaseMaxContribTime > now);
        require(_saleStartTime < _saleEndTime);
        require(_increaseMaxContribTime > _saleStartTime);
        require(_maxContribution > 0);
        require(_minContribution < _maxContribution);

        admin = _admin;
        saleStartTime = _saleStartTime;
        saleEndTime = _saleEndTime;
        increaseMaxContribTime = _increaseMaxContribTime;

        minContribution = _minContribution;
        maxContribution = _maxContribution;
    }

    event UpdateWhitelist(address _user, bool _allow, uint _time);

    /**
     * @dev Update Whitelist Address
     * @param _user - Whitelist address
     * @param _allow - eligibility
     */
    function updateWhitelist(address _user, bool _allow)
        public
        onlyAdmin
    {
        whitelistAddresses[_user] = _allow;
        UpdateWhitelist(_user, _allow, now);
    }

    /**
     * @dev Batch Update Whitelist Address
     * @param _users - Array of Whitelist addresses
     * @param _allows - Array of eligibilities
     */
    function updateWhitelists(address[] _users, bool[] _allows)
        external
        onlyAdmin
    {
        require(_users.length == _allows.length);
        for (uint i = 0 ; i < _users.length ; i++) {
            address _user = _users[i];
            bool _allow = _allows[i];
            whitelistAddresses[_user] = _allow;
            UpdateWhitelist(_user, _allow, now);
        }
    }

    /**
     * @dev Get Eligible Amount
     * @param _contributor - Contributor address
     * @param _amount - Intended contribution amount
     */
    function eligibleAmount(address _contributor, uint256 _amount)
        public
        view
        returns(uint256)
    {
        // If sales has not started or sale ended, there's no allocation
        if (!saleStarted() || saleEnded()) {
            return 0;
        }

        // Amount lesser than minimum contribution will be rejected
        if (_amount < minContribution) {
            return 0;
        }

        uint256 userMaxContribution = maxContribution;
        // If sale has past 24hrs, increase max cap
        if (now >= increaseMaxContribTime) {
            userMaxContribution = maxContribution.mul(10);
        }

        // Calculate remaining contribution for the contributor
        uint256 remainingCap = userMaxContribution.sub(participated[_contributor]);

        // Return either the amount contributed or cap whichever is lower
        return (remainingCap > _amount) ? _amount : remainingCap;
    }

    /**
     * @dev Get if sale has started
     */
    function saleStarted() public view returns(bool) {
        return now >= saleStartTime;
    }

    /**
     * @dev Get if sale has ended
     */
    function saleEnded() public view returns(bool) {
        return now > saleEndTime;
    }

    /**
     * @dev Check for eligible amount and modify participation map
     * @param _contributor - Contributor address
     * @param _amount - Intended contribution amount
     */
    function eligibleAmountCheck(address _contributor, uint256 _amount)
        internal
        returns(uint256)
    {
        // Check if contributor is whitelisted
        if (!whitelistAddresses[_contributor]) {
            return 0;
        }

        uint256 result = eligibleAmount(_contributor, _amount);
        participated[_contributor] = participated[_contributor].add(result);

        return result;
    }
}