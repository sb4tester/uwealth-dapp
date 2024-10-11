import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import UWealthStaking from '../contracts/UWealthStaking.json';

function Staking() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [stakingContract, setStakingContract] = useState(null);
  const [balance, setBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [rewards, setRewards] = useState('0');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        try {
          await window.ethereum.enable();
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = UWealthStaking.networks[networkId];
          const instance = new web3Instance.eth.Contract(
            UWealthStaking.abi,
            deployedNetwork && deployedNetwork.address,
          );
          setStakingContract(instance);

          // Load user's balance, staked amount, and rewards
          const balanceWei = await instance.methods.balanceOf(accounts[0]).call();
          setBalance(web3Instance.utils.fromWei(balanceWei, 'ether'));

          const stakedWei = await instance.methods.stakedAmount(accounts[0]).call();
          setStakedAmount(web3Instance.utils.fromWei(stakedWei, 'ether'));

          const rewardsWei = await instance.methods.earned(accounts[0]).call();
          setRewards(web3Instance.utils.fromWei(rewardsWei, 'ether'));
        } catch (error) {
          console.error("Error initializing Web3", error);
        }
      } else {
        console.log('Please install MetaMask!');
      }
    };

    init();
  }, []);

  const handleStake = async () => {
    if (stakingContract && amount) {
      try {
        const amountWei = web3.utils.toWei(amount, 'ether');
        await stakingContract.methods.stake(amountWei).send({ from: account });
        // Refresh balances after staking
        const balanceWei = await stakingContract.methods.balanceOf(account).call();
        setBalance(web3.utils.fromWei(balanceWei, 'ether'));
        const stakedWei = await stakingContract.methods.stakedAmount(account).call();
        setStakedAmount(web3.utils.fromWei(stakedWei, 'ether'));
      } catch (error) {
        console.error("Error staking tokens", error);
      }
    }
  };

  const handleWithdraw = async () => {
    if (stakingContract && amount) {
      try {
        const amountWei = web3.utils.toWei(amount, 'ether');
        await stakingContract.methods.withdraw(amountWei).send({ from: account });
        // Refresh balances after withdrawing
        const balanceWei = await stakingContract.methods.balanceOf(account).call();
        setBalance(web3.utils.fromWei(balanceWei, 'ether'));
        const stakedWei = await stakingContract.methods.stakedAmount(account).call();
        setStakedAmount(web3.utils.fromWei(stakedWei, 'ether'));
      } catch (error) {
        console.error("Error withdrawing tokens", error);
      }
    }
  };

  const handleClaimRewards = async () => {
    if (stakingContract) {
      try {
        await stakingContract.methods.getReward().send({ from: account });
        // Refresh rewards after claiming
        const rewardsWei = await stakingContract.methods.earned(account).call();
        setRewards(web3.utils.fromWei(rewardsWei, 'ether'));
      } catch (error) {
        console.error("Error claiming rewards", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Staking</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <p className="text-gray-700 text-sm font-bold mb-2">Your UWT Balance: {balance} UWT</p>
          <p className="text-gray-700 text-sm font-bold mb-2">Staked Amount: {stakedAmount} UWT</p>
          <p className="text-gray-700 text-sm font-bold mb-2">Rewards: {rewards} UWT</p>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="amount"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={handleStake}
          >
            Stake
          </button>
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={handleWithdraw}
          >
            Withdraw
          </button>
          <button
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
            onClick={handleClaimRewards}
          >
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  );
}

export default Staking;