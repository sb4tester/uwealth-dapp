// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BlueChipCryptoFund is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ข้อมูลเกี่ยวกับสินทรัพย์ที่กองทุนรองรับ
    struct Asset {
        IERC20 token;
        uint256 allocation; // สัดส่วนการลงทุน (หน่วยเป็นเปอร์เซ็นต์ เช่น 50 หมายถึง 50%)
    }

    Asset[] public assets;
    uint256 public constant MAX_TOTAL_ALLOCATION = 100; // สัดส่วนการลงทุนรวมต้องไม่เกิน 100%

    uint256 public constant MANAGEMENT_FEE = 100; // 1% ค่าธรรมเนียมรายปี (100 basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public lastFeeCalculationTime; // เวลาที่คำนวณค่าธรรมเนียมครั้งล่าสุด

    uint256 public totalShares;
    mapping(address => uint256) public shares;

    event Deposit(address indexed user, address indexed assetToken, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, address indexed assetToken, uint256 amount, uint256 shares);
    event FeesCollected(address indexed feeToken, uint256 amount);
    event AssetAdded(address indexed assetToken, uint256 allocation);
    event AssetRemoved(address indexed assetToken);
    event AssetAllocationUpdated(address indexed assetToken, uint256 newAllocation);
    event Rebalance(address indexed fromToken, address indexed toToken, uint256 amount);

    constructor(address _usdtToken, address _owner) Ownable(_owner) {
        // เพิ่ม USDT เป็นสินทรัพย์เริ่มต้น
        _addAsset(_usdtToken, 100); // เริ่มต้นด้วยการลงทุนใน USDT 100%
        lastFeeCalculationTime = block.timestamp;
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการเพิ่มสินทรัพย์ใหม่
    function addAsset(address _assetToken, uint256 _allocation) external onlyOwner {
        _addAsset(_assetToken, _allocation);
    }

    // ฟังก์ชันภายในสำหรับเพิ่มสินทรัพย์
    function _addAsset(address _assetToken, uint256 _allocation) internal {
        require(_assetToken != address(0), "Invalid asset token address");
        require(_allocation > 0, "Allocation must be greater than 0");

        // ตรวจสอบว่าสัดส่วนการลงทุนรวมไม่เกิน 100%
        uint256 totalAllocation = _allocation;
        for (uint256 i = 0; i < assets.length; i++) {
            totalAllocation += assets[i].allocation;
        }
        require(totalAllocation <= MAX_TOTAL_ALLOCATION, "Total allocation exceeds limit");

        assets.push(Asset({
            token: IERC20(_assetToken),
            allocation: _allocation
        }));

        emit AssetAdded(_assetToken, _allocation);
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการลบสินทรัพย์
    function removeAsset(uint256 _assetIndex) external onlyOwner {
        require(_assetIndex < assets.length, "Invalid asset index");

        address removedAssetToken = address(assets[_assetIndex].token);

        // ลบสินทรัพย์โดยการย้ายสินทรัพย์สุดท้ายมาแทนที่
        assets[_assetIndex] = assets[assets.length - 1];
        assets.pop();

        emit AssetRemoved(removedAssetToken);
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการอัปเดตสัดส่วนการลงทุนของสินทรัพย์
    function updateAssetAllocation(uint256 _assetIndex, uint256 _newAllocation) external onlyOwner {
        require(_assetIndex < assets.length, "Invalid asset index");
        require(_newAllocation > 0, "Allocation must be greater than 0");

        // ตรวจสอบว่าสัดส่วนการลงทุนรวมไม่เกิน 100%
        uint256 totalAllocation = _newAllocation;
        for (uint256 i = 0; i < assets.length; i++) {
            if (i != _assetIndex) {
                totalAllocation += assets[i].allocation;
            }
        }
        require(totalAllocation <= MAX_TOTAL_ALLOCATION, "Total allocation exceeds limit");

        assets[_assetIndex].allocation = _newAllocation;

        emit AssetAllocationUpdated(address(assets[_assetIndex].token), _newAllocation);
    }

    // ฟังก์ชันสำหรับผู้ใช้ในการฝากเงิน
    function deposit(address _assetToken, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Deposit amount must be greater than 0");

        // ค้นหาสินทรัพย์ที่ต้องการฝาก
        uint256 assetIndex;
        bool assetFound = false;
        for (uint256 i = 0; i < assets.length; i++) {
            if (address(assets[i].token) == _assetToken) {
                assetIndex = i;
                assetFound = true;
                break;
            }
        }
        require(assetFound, "Asset not supported");

        // โอนโทเค็นจากผู้ใช้ไปยังสัญญา
        IERC20(_assetToken).safeTransferFrom(msg.sender, address(this), _amount);

        // คำนวณจำนวนหุ้นที่ผู้ใช้จะได้รับ
        uint256 newShares = totalShares == 0 ? _amount : (_amount * totalShares) / getTotalValue();
        shares[msg.sender] += newShares;
        totalShares += newShares;

        emit Deposit(msg.sender, _assetToken, _amount, newShares);
    }

    // ฟังก์ชันสำหรับผู้ใช้ในการถอนเงิน
    function withdraw(address _assetToken, uint256 _shareAmount) external nonReentrant {
        require(_shareAmount > 0 && _shareAmount <= shares[msg.sender], "Invalid share amount");

        // ค้นหาสินทรัพย์ที่ต้องการถอน
        uint256 assetIndex;
        bool assetFound = false;
        for (uint256 i = 0; i < assets.length; i++) {
            if (address(assets[i].token) == _assetToken) {
                assetIndex = i;
                assetFound = true;
                break;
            }
        }
        require(assetFound, "Asset not supported");

        // คำนวณจำนวนเงินที่ผู้ใช้จะได้รับ
        uint256 totalAssetValue = assets[assetIndex].token.balanceOf(address(this));
        uint256 withdrawAmount = (_shareAmount * totalAssetValue) / totalShares;

        // ลดจำนวนหุ้นของผู้ใช้
        shares[msg.sender] -= _shareAmount;
        totalShares -= _shareAmount;

        // โอนโทเค็นไปยังผู้ใช้
        assets[assetIndex].token.safeTransfer(msg.sender, withdrawAmount);

        emit Withdraw(msg.sender, _assetToken, withdrawAmount, _shareAmount);
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการปรับสมดุลพอร์ตโฟลิโอ
    function rebalance(uint256 _fromAssetIndex, uint256 _toAssetIndex, uint256 _amount) external onlyOwner {
        require(_fromAssetIndex < assets.length, "Invalid from asset index");
        require(_toAssetIndex < assets.length, "Invalid to asset index");
        require(_amount > 0, "Amount must be greater than 0");

        // โอนโทเค็นจากสินทรัพย์ต้นทางไปยังสินทรัพย์ปลายทาง
        assets[_fromAssetIndex].token.safeTransfer(address(assets[_toAssetIndex].token), _amount);

        emit Rebalance(address(assets[_fromAssetIndex].token), address(assets[_toAssetIndex].token), _amount);
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการเรียกเก็บค่าธรรมเนียมการจัดการ
    function collectManagementFees() external onlyOwner {
        uint256 timePassed = block.timestamp - lastFeeCalculationTime;
        uint256 totalFeeAmount;

        // คำนวณค่าธรรมเนียมสำหรับแต่ละสินทรัพย์
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 assetBalance = assets[i].token.balanceOf(address(this));
            uint256 feeAmount = (assetBalance * MANAGEMENT_FEE * timePassed) / (365 days * FEE_DENOMINATOR);
            totalFeeAmount += feeAmount;

            // โอนค่าธรรมเนียมไปยังเจ้าของสัญญา
            if (feeAmount > 0) {
                assets[i].token.safeTransfer(owner(), feeAmount);
                emit FeesCollected(address(assets[i].token), feeAmount);
            }
        }

        lastFeeCalculationTime = block.timestamp;
    }

    // ฟังก์ชันสำหรับดูมูลค่ารวมของกองทุน
    function getTotalValue() public view returns (uint256) {
        uint256 totalValue;
        for (uint256 i = 0; i < assets.length; i++) {
            totalValue += assets[i].token.balanceOf(address(this));
        }
        return totalValue;
    }

    // ฟังก์ชันสำหรับดูยอดคงเหลือของผู้ใช้
    function getUserBalance(address _user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[_user] * getTotalValue()) / totalShares;
    }
}
