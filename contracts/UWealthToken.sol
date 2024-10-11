// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UWealthToken is ERC20, ERC20Burnable, Pausable, Ownable {
    uint256 private constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    address public vestingContract;

    constructor(address initialOwner) 
        ERC20("UWealth Token", "UWT") 
        Ownable(initialOwner)
    {
        _mint(initialOwner, 60_000_000 * 10**18); // 60% of total supply for initial distribution
    }

    function setVestingContract(address _vestingContract) external onlyOwner {
        require(_vestingContract != address(0), "Invalid vesting contract address");
        vestingContract = _vestingContract;
    }

    function mintForVesting(uint256 amount) external {
        require(msg.sender == vestingContract, "Only vesting contract can mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(vestingContract, amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 amount)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, amount);
    }
}