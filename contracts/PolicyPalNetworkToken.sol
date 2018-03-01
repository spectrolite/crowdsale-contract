pragma solidity ^0.4.18;

import './zeppelin/token/StandardToken.sol';
import './zeppelin/token/BurnableToken.sol';
import './zeppelin/ownership/Ownable.sol';

/**
 * @title PolicyPalNetwork Token
 * @dev A standard ownable token
 */
contract PolicyPalNetworkToken is StandardToken, BurnableToken, Ownable {
    /**
    * @dev Token Contract Constants
    */
    string    public constant name     = "PolicyPal Network Token";
    string    public constant symbol   = "PAL";
    uint8     public constant decimals = 18;

    /**
    * @dev Token Contract Public Variables
    */
    address public  tokenSaleContract;
    bool    public  isTokenTransferable = false;


    /**
    * @dev   Token Contract Modifier
    *
    * Check if a transfer is allowed
    * Transfers are restricted to token creator & owner(admin) during token sale duration
    * Transfers after token sale is limited by `isTokenTransferable` toggle
    *
    */
    modifier onlyWhenTransferAllowed() {
        require(isTokenTransferable || msg.sender == owner || msg.sender == tokenSaleContract);
        _;
    }

    /**
     * @dev Token Contract Modifier
     * @param _to - Address to check if valid
     *
     *  Check if an address is valid
     *  A valid address is as follows,
     *    1. Not zero address
     *    2. Not token address
     *
     */
    modifier isValidDestination(address _to) {
        require(_to != address(0x0));
        require(_to != address(this));
        _;
    }

    /**
     * @dev Enable Transfers (Only Owner)
     */
    function toggleTransferable(bool _toggle) external
        onlyOwner
    {
        isTokenTransferable = _toggle;
    }
    

    /**
    * @dev Token Contract Constructor
    * @param _adminAddr - Address of the Admin
    */
    function PolicyPalNetworkToken(
        uint _tokenTotalAmount,
        address _adminAddr
    ) 
        public
        isValidDestination(_adminAddr)
    {
        require(_tokenTotalAmount > 0);

        totalSupply_ = _tokenTotalAmount;

        // Mint all token
        balances[msg.sender] = _tokenTotalAmount;
        Transfer(address(0x0), msg.sender, _tokenTotalAmount);

        // Assign token sale contract to creator
        tokenSaleContract = msg.sender;

        // Transfer contract ownership to admin
        transferOwnership(_adminAddr);
    }

    /**
    * @dev Token Contract transfer
    * @param _to - Address to transfer to
    * @param _value - Value to transfer
    * @return bool - Result of transfer
    * "Overloaded" Function of ERC20Basic's transfer
    *
    */
    function transfer(address _to, uint256 _value) public
        onlyWhenTransferAllowed
        isValidDestination(_to)
        returns (bool)
    {
        return super.transfer(_to, _value);
    }

    /**
    * @dev Token Contract transferFrom
    * @param _from - Address to transfer from
    * @param _to - Address to transfer to
    * @param _value - Value to transfer
    * @return bool - Result of transferFrom
    *
    * "Overloaded" Function of ERC20's transferFrom
    * Added with modifiers,
    *    1. onlyWhenTransferAllowed
    *    2. isValidDestination
    *
    */
    function transferFrom(address _from, address _to, uint256 _value) public
        onlyWhenTransferAllowed
        isValidDestination(_to)
        returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    /**
    * @dev Token Contract burn
    * @param _value - Value to burn
    * "Overloaded" Function of BurnableToken's burn
    */
    function burn(uint256 _value)
        public
    {
        super.burn(_value);
        Transfer(msg.sender, address(0x0), _value);
    }

    /**
    * @dev Token Contract Emergency Drain
    * @param _token - Token to drain
    * @param _amount - Amount to drain
    */
    function emergencyERC20Drain(ERC20 _token, uint256 _amount) public
        onlyOwner
    {
        _token.transfer(owner, _amount);
    }
}