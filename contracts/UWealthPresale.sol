// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UWealthPresale is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public uwtToken;
    IERC20 public usdtToken;

    uint256 public startTime;
    uint256 public endTime;
    uint256 public tokensPerBNB;
    uint256 public tokensPerUSDT;
    uint256 public minPurchaseBNB;
    uint256 public maxPurchaseBNB;
    uint256 public minPurchaseUSDT;
    uint256 public maxPurchaseUSDT;
    uint256 public totalTokensSold;

    uint256 public constant PRESALE_SUPPLY = 50_000_000 * 10**18; // 50 million tokens

    mapping(address => uint256) public purchases;

    event PresaleStarted(uint256 startTime, uint256 endTime);
    event TokensPurchased(address indexed buyer, uint256 amount, string currency);
    event PresaleEnded(uint256 totalSold);
    event TokensWithdrawn(uint256 amount);
    event BNBWithdrawn(uint256 amount);
    event USDTWithdrawn(uint256 amount);

    constructor(address _uwtToken, address _usdtToken, address initialOwner) Ownable(initialOwner) {
        uwtToken = IERC20(_uwtToken);
        usdtToken = IERC20(_usdtToken);
    }

    function startPresale(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tokensPerBNB,
        uint256 _tokensPerUSDT,
        uint256 _minPurchaseBNB,
        uint256 _maxPurchaseBNB,
        uint256 _minPurchaseUSDT,
        uint256 _maxPurchaseUSDT
    ) external onlyOwner {
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        startTime = _startTime;
        endTime = _endTime;
        tokensPerBNB = _tokensPerBNB;
        tokensPerUSDT = _tokensPerUSDT;
        minPurchaseBNB = _minPurchaseBNB;
        maxPurchaseBNB = _maxPurchaseBNB;
        minPurchaseUSDT = _minPurchaseUSDT;
        maxPurchaseUSDT = _maxPurchaseUSDT;
        emit PresaleStarted(startTime, endTime);
    }

    function setEndTime(uint256 _newEndTime) external onlyOwner {
        require(_newEndTime > block.timestamp, "New end time must be in the future");
        require(_newEndTime > startTime, "New end time must be after start time");
        endTime = _newEndTime;
    }

function buyTokensWithBNB() public payable {
    require(block.timestamp >= startTime && block.timestamp <= endTime, "Presale is not active");
    require(msg.value >= minPurchaseBNB, "Below minimum purchase limit");
    require(msg.value <= maxPurchaseBNB, "Above maximum purchase limit");

    uint256 tokenAmount = msg.value.mul(tokensPerBNB).div(1 ether);
    require(totalTokensSold.add(tokenAmount) <= PRESALE_SUPPLY, "Exceeds presale supply");

    totalTokensSold = totalTokensSold.add(tokenAmount);
    purchases[msg.sender] = purchases[msg.sender].add(tokenAmount);

    uwtToken.safeTransfer(msg.sender, tokenAmount);

    emit TokensPurchased(msg.sender, tokenAmount, "BNB");
}

    function buyTokensWithUSDT(uint256 usdtAmount) external {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Presale is not active");
        require(usdtAmount >= minPurchaseUSDT, "Below minimum purchase limit");
        require(usdtAmount <= maxPurchaseUSDT, "Above maximum purchase limit");

        uint256 tokenAmount = usdtAmount.mul(tokensPerUSDT).div(10**6); // USDT has 6 decimals
        require(totalTokensSold.add(tokenAmount) <= PRESALE_SUPPLY, "Exceeds presale supply");

        totalTokensSold = totalTokensSold.add(tokenAmount);
        purchases[msg.sender] = purchases[msg.sender].add(tokenAmount);

        usdtToken.safeTransferFrom(msg.sender, address(this), usdtAmount);
        uwtToken.safeTransfer(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, tokenAmount, "USDT");
    }

    function endPresale() external onlyOwner {
        require(block.timestamp > endTime, "Presale has not ended yet");
        emit PresaleEnded(totalTokensSold);
    }

    function withdrawRemainingTokens() external onlyOwner {
        require(block.timestamp > endTime, "Presale has not ended yet");
        uint256 remainingTokens = uwtToken.balanceOf(address(this));
        require(remainingTokens > 0, "No tokens to withdraw");
        uwtToken.safeTransfer(owner(), remainingTokens);
        emit TokensWithdrawn(remainingTokens);
    }

    function withdrawBNB() external onlyOwner {
        require(block.timestamp > endTime, "Presale has not ended yet");
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        payable(owner()).transfer(balance);
        emit BNBWithdrawn(balance);
    }

    function withdrawUSDT() external onlyOwner {
    require(block.timestamp > endTime, "Presale has not ended yet");
    uint256 balance = usdtToken.balanceOf(address(this));
    require(balance > 0, "No USDT to withdraw");
    usdtToken.safeTransfer(owner(), balance);
    emit USDTWithdrawn(balance);
    }

    receive() external payable {
    require(block.timestamp >= startTime && block.timestamp <= endTime, "Presale is not active");
    require(msg.value >= minPurchaseBNB, "Below minimum purchase limit");
    require(msg.value <= maxPurchaseBNB, "Above maximum purchase limit");

    uint256 tokenAmount = msg.value.mul(tokensPerBNB).div(1 ether);
    require(totalTokensSold.add(tokenAmount) <= PRESALE_SUPPLY, "Exceeds presale supply");

    totalTokensSold = totalTokensSold.add(tokenAmount);
    purchases[msg.sender] = purchases[msg.sender].add(tokenAmount);

    uwtToken.safeTransfer(msg.sender, tokenAmount);

    emit TokensPurchased(msg.sender, tokenAmount, "BNB");
}
}