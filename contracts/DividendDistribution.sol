// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DividendDistribution is Ownable, ReentrancyGuard {
    IERC20 public uwtToken;
    IERC20 public usdtToken;

    uint256 public totalDividends;
    uint256 public dividendPerToken;
    mapping(address => uint256) public lastDividendPoints;
    mapping(address => uint256) public unclaimedDividends;

    event DividendsDistributed(uint256 amount);
    event DividendsClaimed(address indexed user, uint256 amount);

    constructor(address _uwtToken, address _usdtToken) {
        uwtToken = IERC20(_uwtToken);
        usdtToken = IERC20(_usdtToken);
    }

    function distributeDividends(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        totalDividends += amount;
        dividendPerToken += (amount * 1e18) / uwtToken.totalSupply();

        emit DividendsDistributed(amount);
    }

    function claimDividends() external nonReentrant {
        uint256 dividends = calculateUnclaimedDividends(msg.sender);
        require(dividends > 0, "No dividends to claim");

        lastDividendPoints[msg.sender] = dividendPerToken;
        unclaimedDividends[msg.sender] = 0;

        require(usdtToken.transfer(msg.sender, dividends), "Transfer failed");

        emit DividendsClaimed(msg.sender, dividends);
    }

    function calculateUnclaimedDividends(address user) public view returns (uint256) {
        uint256 newDividends = (uwtToken.balanceOf(user) * (dividendPerToken - lastDividendPoints[user])) / 1e18;
        return unclaimedDividends[user] + newDividends;
    }
}