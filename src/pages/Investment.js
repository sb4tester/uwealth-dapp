import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';
import useContract from '../hooks/useContract';
import BlueChipCryptoFundABI from '../contracts/BlueChipCryptoFund.json';

function Investment() {
  const { web3, account } = useContext(Web3Context);
  const [balance, setBalance] = useState('0');
  const [investmentAmount, setInvestmentAmount] = useState('');

  const contractAddress = '0x...'; // Replace with actual contract address
  const contract = useContract(BlueChipCryptoFundABI.abi, contractAddress);

  useEffect(() => {
    if (contract && account) {
      updateBalance();
    }
  }, [contract, account]);

  const updateBalance = async () => {
    const bal = await contract.methods.getUserBalance(account).call();
    setBalance(web3.utils.fromWei(bal, 'ether'));
  };

  const handleInvest = async () => {
    if (contract && account && investmentAmount) {
      try {
        const amountWei = web3.utils.toWei(investmentAmount, 'ether');
        await contract.methods.deposit(amountWei).send({ from: account });
        updateBalance();
        setInvestmentAmount('');
      } catch (error) {
        console.error('Investment failed:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Investment</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <p className="mb-4">Your current investment: {balance} UWT</p>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="investmentAmount">
            Investment Amount (UWT)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="investmentAmount"
            type="number"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            placeholder="Enter amount to invest"
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          onClick={handleInvest}
        >
          Invest
        </button>
      </div>
    </div>
  );
}

export default Investment;