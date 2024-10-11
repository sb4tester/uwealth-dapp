import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';
import useContract from '../hooks/useContract';
import UWealthGovernanceABI from '../contracts/UWealthGovernance.json';

function Governance() {
  const { web3, account } = useContext(Web3Context);
  const [proposals, setProposals] = useState([]);
  const [newProposal, setNewProposal] = useState('');

  const contractAddress = '0x...'; // Replace with actual contract address
  const contract = useContract(UWealthGovernanceABI.abi, contractAddress);

  useEffect(() => {
    if (contract) {
      fetchProposals();
    }
  }, [contract]);

  const fetchProposals = async () => {
    // This is a simplified example. In reality, you'd need to implement event listening or other methods to fetch proposals.
    const proposalCount = await contract.methods.proposalCount().call();
    const fetchedProposals = [];
    for (let i = 1; i <= proposalCount; i++) {
      const proposal = await contract.methods.proposals(i).call();
      fetchedProposals.push(proposal);
    }
    setProposals(fetchedProposals);
  };

  const handleSubmitProposal = async () => {
    if (contract && account && newProposal) {
      try {
        await contract.methods.submitProposal(newProposal).send({ from: account });
        setNewProposal('');
        fetchProposals();
      } catch (error) {
        console.error('Failed to submit proposal:', error);
      }
    }
  };

  const handleVote = async (proposalId, support) => {
    if (contract && account) {
      try {
        await contract.methods.castVote(proposalId, support).send({ from: account });
        fetchProposals();
      } catch (error) {
        console.error('Failed to cast vote:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Governance</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Submit New Proposal</h2>
        <div className="mb-4">
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            value={newProposal}
            onChange={(e) => setNewProposal(e.target.value)}
            placeholder="Enter proposal description"
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleSubmitProposal}
        >
          Submit Proposal
        </button>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Active Proposals</h2>
        {proposals.map((proposal, index) => (
          <div key={index} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <p className="mb-4">{proposal.description}</p>
            <div className="flex justify-between">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() => handleVote(proposal.id, true)}
              >
                Vote For
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() => handleVote(proposal.id, false)}
              >
                Vote Against
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Governance;