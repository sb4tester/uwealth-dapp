// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TradingBot is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public usdtToken;
    address public trader;
    uint256 public constant PERFORMANCE_FEE = 2000; // 20% performance fee (2000 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;

    uint256 public totalShares;
    mapping(address => uint256) public shares;
    uint256 public lastNavPerShare;

    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 amount, uint256 shares);
    event Trade(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event PerformanceFeePaid(uint256 amount);

    constructor(address _usdtToken, address _trader, address _initialOwner) Ownable(_initialOwner) {
        usdtToken = IERC20(_usdtToken);
        trader = _trader;
    }

    function setTrader(address _newTrader) external onlyOwner {
        trader = _newTrader;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Deposit amount must be greater than 0");
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);

        uint256 newShares = totalShares == 0 ? amount : (amount * totalShares) / getTotalValue();
        shares[msg.sender] += newShares;
        totalShares += newShares;

        if (lastNavPerShare == 0) {
            lastNavPerShare = 1e18;
        }

        emit Deposit(msg.sender, amount, newShares);
    }

    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0 && shareAmount <= shares[msg.sender], "Invalid share amount");

        uint256 totalValue = getTotalValue();
        uint256 withdrawAmount = (shareAmount * totalValue) / totalShares;

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        // Calculate and pay performance fee
        uint256 navPerShare = (totalValue * 1e18) / totalShares;
        if (navPerShare > lastNavPerShare) {
            uint256 profit = ((navPerShare - lastNavPerShare) * shareAmount) / 1e18;
            uint256 performanceFee = (profit * PERFORMANCE_FEE) / FEE_DENOMINATOR;
            withdrawAmount -= performanceFee;
            usdtToken.safeTransfer(owner(), performanceFee);
            emit PerformanceFeePaid(performanceFee);
        }

        lastNavPerShare = navPerShare;

        usdtToken.safeTransfer(msg.sender, withdrawAmount);

        emit Withdraw(msg.sender, withdrawAmount, shareAmount);
    }

function executeTrade(
    address tokenIn,
    address tokenOut,
    uint256 amountIn,
    uint256 minAmountOut,
    bytes calldata data
) external nonReentrant {
    require(msg.sender == trader, "Only trader can execute trades");
    
    IERC20(tokenIn).approve(address(this), amountIn);
    
    (bool success, ) = address(this).call(data);
    require(success, "Trade execution failed");
    
    uint256 amountOut = IERC20(tokenOut).balanceOf(address(this));
    require(amountOut >= minAmountOut, "Insufficient output amount");
    
    emit Trade(tokenIn, tokenOut, amountIn, amountOut);
}

    function getTotalValue() public view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }

    function getUserBalance(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[user] * getTotalValue()) / totalShares;
    }
}