// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UWealthVesting is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    IERC20 public uwtToken;
    
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 duration;
        uint256 releasedAmount;
        bool revocable;
        bool revoked;
    }
    
    mapping(address => VestingSchedule[]) public vestingSchedules;
    
    event VestingScheduleCreated(address beneficiary, uint256 index);
    event TokensReleased(address beneficiary, uint256 amount);
    event VestingRevoked(address beneficiary, uint256 index);
    
    constructor(address _tokenAddress, address initialOwner) Ownable(initialOwner) {
        uwtToken = IERC20(_tokenAddress);
    }
    
    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _startTime,
        uint256 _cliffDuration,
        uint256 _duration,
        bool _revocable
    ) external onlyOwner {
        require(_beneficiary != address(0), "Beneficiary cannot be zero address");
        require(_amount > 0, "Amount must be greater than 0");
        require(_duration > _cliffDuration, "Duration must be greater than cliff");
        
        uint256 currentTime = block.timestamp;
        require(_startTime >= currentTime, "Start time must be in the future");
        
        VestingSchedule memory newSchedule = VestingSchedule({
            totalAmount: _amount,
            startTime: _startTime,
            cliffDuration: _cliffDuration,
            duration: _duration,
            releasedAmount: 0,
            revocable: _revocable,
            revoked: false
        });
        
        vestingSchedules[_beneficiary].push(newSchedule);
        
        uint256 index = vestingSchedules[_beneficiary].length - 1;
        
        require(uwtToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        
        emit VestingScheduleCreated(_beneficiary, index);
    }
    
    function release(uint256 _index) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender][_index];
        require(schedule.totalAmount > 0, "No vesting schedule found");
        require(!schedule.revoked, "Vesting has been revoked");
        
        uint256 releasableAmount = calculateReleasableAmount(schedule);
        require(releasableAmount > 0, "No tokens are due for release");
        
        schedule.releasedAmount = schedule.releasedAmount.add(releasableAmount);
        require(uwtToken.transfer(msg.sender, releasableAmount), "Token transfer failed");
        
        emit TokensReleased(msg.sender, releasableAmount);
    }
    
    function revoke(address _beneficiary, uint256 _index) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary][_index];
        require(schedule.revocable, "Vesting is not revocable");
        require(!schedule.revoked, "Vesting already revoked");
        
        uint256 releasableAmount = calculateReleasableAmount(schedule);
        uint256 refundAmount = schedule.totalAmount.sub(schedule.releasedAmount).sub(releasableAmount);
        
        schedule.revoked = true;
        
        if (releasableAmount > 0) {
            schedule.releasedAmount = schedule.releasedAmount.add(releasableAmount);
            require(uwtToken.transfer(_beneficiary, releasableAmount), "Token transfer failed");
        }
        
        if (refundAmount > 0) {
            require(uwtToken.transfer(owner(), refundAmount), "Token transfer failed");
        }
        
        emit VestingRevoked(_beneficiary, _index);
    }
    
    function getVestingSchedulesCount(address _beneficiary) external view returns (uint256) {
        return vestingSchedules[_beneficiary].length;
    }
    
    function getVestingSchedule(address _beneficiary, uint256 _index) external view returns (VestingSchedule memory) {
        return vestingSchedules[_beneficiary][_index];
    }
    
    function calculateReleasableAmount(VestingSchedule memory _schedule) internal view returns (uint256) {
        if (block.timestamp < _schedule.startTime.add(_schedule.cliffDuration)) {
            return 0;
        }
        if (block.timestamp >= _schedule.startTime.add(_schedule.duration)) {
            return _schedule.totalAmount.sub(_schedule.releasedAmount);
        }
        uint256 timeFromStart = block.timestamp.sub(_schedule.startTime);
        uint256 vestedAmount = _schedule.totalAmount.mul(timeFromStart).div(_schedule.duration);
        return vestedAmount.sub(_schedule.releasedAmount);
    }
}