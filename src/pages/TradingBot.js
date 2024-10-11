import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';
import useContract from '../hooks/useContract';
import TradingBotABI from '../contracts/TradingBot.json';

function TradingBot() {
  const { web3, account } = useContext(Web3Context);
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('');

  const contractAddress = '0x...'; // Replace with actual contract address
  const contract = useContract(TradingBotABI.abi, contractAddress);

  useEffect(() => {
    if (contract && account) {
      updateBalance();
    }
  }, [contract, account]);

  const updateBalance = async () => {
    const bal = await contract.methods.getUserBalance(account).call();
    setBalance(web3.utils.fromWei(bal, 'ether'));
  };

  const handleDeposit = async () => {
    if (contract && account && amount) {
      try {
        const amountWei = web3.utils.toWei(amount, 'ether');
        await contract.methods.deposit(amountWei).send({ from: account });
        updateBalance();
        setAmount('');
      } catch (error) {
        console.error('Deposit failed:', error);
      }
    }
  };

  const handleWithdraw = async () => {
    if (contract && account && amount) {
      try {
        const amountWei = web3.utils.toWei(amount, 'ether');
        await contract.methods.withdraw(amountWei).send({ from: account });
        updateBalance();
        setAmount('');
      } catch (error) {
        console.error('Withdrawal failed:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Trading Bot</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <p className="mb-4">Your current balance: {balance} UWT</p>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount (UWT)
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>
        <div className="flex justify-between">
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleDeposit}
          >
            Deposit
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleWithdraw}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

export default TradingBot;