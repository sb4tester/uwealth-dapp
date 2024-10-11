// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // เพิ่ม Ownable

contract UWealthGovernance is Governor, GovernorSettings, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorTimelockControl, Ownable { // เพิ่ม Ownable
    constructor(IVotes _token, TimelockController _timelock)
        Governor("UWealth Governance")
        GovernorSettings(1 days, 1 weeks, 1000e18) // ปรับค่าตามความเหมาะสม
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4) // ปรับค่าตามความเหมาะสม
        GovernorTimelockControl(_timelock)
        Ownable(msg.sender) // กำหนดเจ้าของเริ่มต้น
    {}

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการอัปเดต TimelockController
    function updateTimelock(TimelockController _newTimelock) external onlyOwner override { // Add "override" here
        this.updateTimelock(_newTimelock); 
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการอัปเดตค่า Quorum Fraction
    function updateQuorumFraction(uint256 _newQuorumFraction) external onlyOwner {
        this.updateQuorumNumerator(_newQuorumFraction);
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการอัปเดตค่า Voting Delay
    function updateVotingDelay(uint256 _newVotingDelay) external onlyOwner {
        this.updateVotingDelay(_newVotingDelay);
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการอัปเดตค่า Voting Period
    function updateVotingPeriod(uint256 _newVotingPeriod) external onlyOwner {
        this.updateVotingPeriod(_newVotingPeriod);
    }

    // ฟังก์ชันสำหรับเจ้าของสัญญาในการอัปเดตค่า Proposal Threshold
    function updateProposalThreshold(uint256 _newProposalThreshold) external onlyOwner {
        this.updateProposalThreshold(_newProposalThreshold);
    }

    function votingDelay()
        public
        view
        override(Governor, GovernorSettings) // Corrected override
        returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings) // Corrected override
        returns (uint256)
    {
        return super.votingPeriod();
    }

function quorum(uint256 blockNumber)
    public
    view
    override(Governor, GovernorVotesQuorumFraction) // Correct override statement
    returns (uint256)
{
    return super.quorum(blockNumber);
}

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

function propose(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, string memory description)
        public
        override(Governor) // Correct override statement
        returns (uint256)
    {
        return super.propose(targets, values, calldatas, description);
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function _execute(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
        internal
        override(Governor, GovernorTimelockControl)
    {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    internal 
    returns (uint256) // Removed "override"
{
    return super._cancel(targets, values, calldatas, descriptionHash);
}

    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}