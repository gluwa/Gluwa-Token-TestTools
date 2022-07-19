pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "./ERC20Reservable.sol";
contract TestERC20 is ERC20("Test Token", "TEST") {
    function faucetMint(address _to, uint256 _amount)public{
        _mint(_to, _amount);
    }
    function chainId()public view returns(uint256){
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}