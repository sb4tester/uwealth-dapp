// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UWealthPresale is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public uwtToken;
    IERC20 public usdtToken;

    uint256 public constant TOKENS_PER_USDT = 10; // 1 USDT = 10 UWT
    uint256 public tokensPerBNB; // Will be set by owner
    uint256 public constant MIN_PURCHASE_USDT = 100 * 1e6; // 100 USDT minimum
    uint256 public constant MAX_PURCHASE_USDT = 10000 * 1e6; // 10,000 USDT maximum
    uint256 public minPurchaseBNB; // Will be set by owner
    uint256 public maxPurchaseBNB; // Will be set by owner
    uint256 public constant PRESALE_SUPPLY = 40_000_000 * 1e18; // 40 million UWT for presale

    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalTokensSold;

    mapping(address => uint256) public purchases;

    event TokensPurchased(address indexed buyer, uint256 amount, string currency);
    event PresaleStarted(uint256 startTime, uint256 endTime);
    event PresaleEnded(uint256 totalSold);
    event BNBRateUpdated(uint256 newRate);

    constructor(
        address _uwtToken,
        address _usdtToken,
        address initialOwner
    ) Ownable(initialOwner) {
        uwtToken = IERC20(_uwtToken);
        usdtToken = IERC20(_usdtToken);
    }

    function startPresale(uint256 _duration, uint256 _tokensPerBNB, uint256 _minPurchaseBNB, uint256 _maxPurchaseBNB) external onlyOwner {
        require(startTime == 0, "Presale already started");
        startTime = block.timestamp;
        endTime = startTime + _duration;
        tokensPerBNB = _tokensPerBNB;
        minPurchaseBNB = _minPurchaseBNB;
        maxPurchaseBNB = _maxPurchaseBNB;
        emit PresaleStarted(startTime, endTime);
        emit BNBRateUpdated(tokensPerBNB);
    }

    function buyTokensWithUSDT(uint256 usdtAmount) external nonReentrant {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Presale is not active");
        require(usdtAmount >= MIN_PURCHASE_USDT && usdtAmount <= MAX_PURCHASE_USDT, "Invalid purchase amount");
        require(purchases[msg.sender] + usdtAmount <= MAX_PURCHASE_USDT, "Exceeds maximum purchase limit");

        uint256 tokenAmount = usdtAmount * TOKENS_PER_USDT / 1e6; // Adjust for USDT's 6 decimals
        require(totalTokensSold + tokenAmount <= PRESALE_SUPPLY, "Exceeds presale supply");

        usdtToken.safeTransferFrom(msg.sender, address(this), usdtAmount);
        uwtToken.safeTransfer(msg.sender, tokenAmount);

        totalTokensSold += tokenAmount;
        purchases[msg.sender] += usdtAmount;

        emit TokensPurchased(msg.sender, tokenAmount, "USDT");
    }

    function buyTokensWithBNB() external payable nonReentrant {
        _buyTokensWithBNB();
    }

    function endPresale() external onlyOwner {
        require(block.timestamp > endTime, "Presale has not ended yet");
        uint256 remainingTokens = uwtToken.balanceOf(address(this));
        if (remainingTokens > 0) {
            uwtToken.safeTransfer(owner(), remainingTokens);
        }
        uint256 collectedUSDT = usdtToken.balanceOf(address(this));
        if (collectedUSDT > 0) {
            usdtToken.safeTransfer(owner(), collectedUSDT);
        }
        uint256 collectedBNB = address(this).balance;
        if (collectedBNB > 0) {
            payable(owner()).transfer(collectedBNB);
        }

        emit PresaleEnded(totalTokensSold);
    }

    function setEndTime(uint256 _newEndTime) external onlyOwner {
        require(_newEndTime > block.timestamp, "New end time must be in the future");
        endTime = _newEndTime;
    }

    function updateBNBRate(uint256 _newRate) external onlyOwner {
        tokensPerBNB = _newRate;
        emit BNBRateUpdated(_newRate);
    }

    receive() external payable {
        _buyTokensWithBNB();
    }

    function _buyTokensWithBNB() internal {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Presale is not active");
        require(msg.value >= minPurchaseBNB && msg.value <= maxPurchaseBNB, "Invalid purchase amount");

        uint256 tokenAmount = msg.value * tokensPerBNB / 1e18; // Adjust for BNB's 18 decimals
        require(totalTokensSold + tokenAmount <= PRESALE_SUPPLY, "Exceeds presale supply");

        uwtToken.safeTransfer(msg.sender, tokenAmount);

        totalTokensSold += tokenAmount;
        purchases[msg.sender] += msg.value;

        emit TokensPurchased(msg.sender, tokenAmount, "BNB");
    }
}