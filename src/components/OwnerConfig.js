import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';
import presaleABI from '../contracts/UWealthPresale.json';
import { ERC20ABI } from '../contracts/ERC20ABI';
import config from '../config/config';

function OwnerConfig() {
  const { web3, account, checkNetwork } = useContext(Web3Context);
  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContracts, setTokenContracts] = useState({
    usdt: null,
    uwt: null
  });
  const [balances, setBalances] = useState({
    bnb: '0',
    usdt: '0',
    uwt: '0'
  });
  const [presaleData, setPresaleData] = useState({
    isPaused: false,
    currentPrice: '0',
    startTime: 0,
    endTime: 0,
    vestingStartTime: 0,
    enableBuyWithEth: true,
    enableBuyWithUsdt: true
  });
  
  const [formData, setFormData] = useState({
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    price: '',
    totalTokens: '',
    vestingCliffDays: '30',
    vestingPeriodDays: '180',
    enableBuyWithEth: true,
    enableBuyWithUsdt: true,
    newPrice: '',
    newTokenAddress: '',
    newVestingStartDate: '',
    newVestingStartTime: ''
  });

  useEffect(() => {
    initializeContract();
  }, [web3, account]);

  const initializeContract = async () => {
    if (!web3) return;
    try {
      const contract = new web3.eth.Contract(
        presaleABI,
        config.contracts.presale
      );
      
      const USDTContract = new web3.eth.Contract(ERC20ABI, config.contracts.mockUSDT);
      const UWTContract = new web3.eth.Contract(ERC20ABI, config.contracts.uwtToken);
      
      setPresaleContract(contract);
      setTokenContracts({ 
        usdt: USDTContract, 
        uwt: UWTContract 
      });
      
      await loadPresaleData(contract, USDTContract, UWTContract);
    } catch (error) {
      console.error('Contract initialization error:', error);
      handleError(error);
    }
  };

  const loadPresaleData = async (contract, USDTContract, UWTContract) => {
    try {
      const [
        paused,
        currentPresale,
        bnbBalance,
        usdtBalance,
        uwtBalance
      ] = await Promise.all([
        contract.methods.paused(1).call(),
        contract.methods.presale(1).call(),
        web3.eth.getBalance(contract._address),
        USDTContract.methods.balanceOf(contract._address).call(),
        UWTContract.methods.balanceOf(contract._address).call()
      ]);

      setPresaleData({
        isPaused: paused,
        currentPrice: web3.utils.fromWei(currentPresale.price),
        startTime: parseInt(currentPresale.startTime),
        endTime: parseInt(currentPresale.endTime),
        vestingStartTime: parseInt(currentPresale.vestingStartTime),
        enableBuyWithEth: currentPresale.enableBuyWithEth === '1',
        enableBuyWithUsdt: currentPresale.enableBuyWithUsdt === '1'
      });

      setBalances({
        bnb: web3.utils.fromWei(bnbBalance),
        usdt: web3.utils.fromWei(usdtBalance, 'mwei'),
        uwt: web3.utils.fromWei(uwtBalance)
      });
    } catch (error) {
      console.error('Loading presale data error:', error);
      handleError(error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const convertToTimestamp = (date, time) => {
    return Math.floor(new Date(`${date}T${time}`).getTime() / 1000);
  };

  const handleError = (error) => {
    if (error.code === 4001) {
      alert('Transaction rejected by user');
    } else {
      alert(`Error: ${error.message}`);
    }
  };

  const handleTransaction = async (transaction, successMessage) => {
    try {
      const tx = await transaction();
      alert(successMessage);
      await loadPresaleData(presaleContract, tokenContracts.usdt, tokenContracts.uwt);
    } catch (error) {
      console.error(error);
      handleError(error);
    }
  };

  // Create Presale
  const handleCreatePresale = () => {
    handleTransaction(async () => {
      const startTimestamp = convertToTimestamp(formData.startDate, formData.startTime);
      const endTimestamp = convertToTimestamp(formData.endDate, formData.endTime);
      const vestingStartTime = endTimestamp;
      const vestingCliffSeconds = formData.vestingCliffDays * 24 * 3600;
      const vestingPeriodSeconds = formData.vestingPeriodDays * 24 * 3600;

      await presaleContract.methods.createPresale(
        startTimestamp,
        endTimestamp,
        web3.utils.toWei(formData.price, 'ether'),
        web3.utils.toWei(formData.totalTokens, 'ether'),
        18,
        vestingStartTime,
        vestingCliffSeconds,
        vestingPeriodSeconds,
        formData.enableBuyWithEth ? 1 : 0,
        formData.enableBuyWithUsdt ? 1 : 0
      ).send({ from: account });
    }, 'Presale created successfully!');
  };

  // Change Sale Times
  const handleChangeSaleTimes = () => {
    handleTransaction(async () => {
      const startTimestamp = convertToTimestamp(formData.startDate, formData.startTime);
      const endTimestamp = convertToTimestamp(formData.endDate, formData.endTime);
      
      await presaleContract.methods.changeSaleTimes(
        1, startTimestamp, endTimestamp
      ).send({ from: account });
    }, 'Sale times updated successfully!');
  };

  // Change Price
  const handleChangePrice = () => {
    handleTransaction(async () => {
      const newPriceWei = web3.utils.toWei(formData.newPrice, 'ether');
      await presaleContract.methods.changePrice(1, newPriceWei)
        .send({ from: account });
    }, 'Price updated successfully!');
  };

  // Change Vesting Start Time
  const handleChangeVestingStartTime = () => {
    handleTransaction(async () => {
      const newVestingStart = convertToTimestamp(
        formData.newVestingStartDate, 
        formData.newVestingStartTime
      );
      
      await presaleContract.methods.changeVestingStartTime(1, newVestingStart)
        .send({ from: account });
    }, 'Vesting start time updated successfully!');
  };

  // Toggle Buy Methods
  const handleToggleBuyWithEth = () => {
    handleTransaction(async () => {
      await presaleContract.methods.changeEnableBuyWithEth(
        1, 
        presaleData.enableBuyWithEth ? 0 : 1
      ).send({ from: account });
    }, 'BNB buying status updated!');
  };

  const handleToggleBuyWithUsdt = () => {
    handleTransaction(async () => {
      await presaleContract.methods.changeEnableBuyWithUsdt(
        1, 
        presaleData.enableBuyWithUsdt ? 0 : 1
      ).send({ from: account });
    }, 'USDT buying status updated!');
  };

  // Pause/Unpause
  const handleTogglePause = () => {
    handleTransaction(async () => {
      if (presaleData.isPaused) {
        await presaleContract.methods.unPausePresale(1).send({ from: account });
      } else {
        await presaleContract.methods.pausePresale(1).send({ from: account });
      }
    }, `Presale ${presaleData.isPaused ? 'unpaused' : 'paused'} successfully!`);
  };

  // Withdrawals
  const handleWithdrawTokens = () => {
    handleTransaction(async () => {
      await presaleContract.methods.withdrawRemainingTokens()
        .send({ from: account });
    }, 'Tokens withdrawn successfully!');
  };

  const handleWithdrawBNB = () => {
    handleTransaction(async () => {
      await presaleContract.methods.withdrawBNB()
        .send({ from: account });
    }, 'BNB withdrawn successfully!');
  };

  const handleWithdrawUSDT = () => {
    handleTransaction(async () => {
      await presaleContract.methods.withdrawUSDT()
        .send({ from: account });
    }, 'USDT withdrawn successfully!');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Presale Management</h1>

      {/* Current Status */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Current Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700">Status: {presaleData.isPaused ? 'Paused' : 'Active'}</p>
            <p className="text-gray-700">Current Price: {presaleData.currentPrice} BNB</p>
            <p className="text-gray-700">BNB Buying: {presaleData.enableBuyWithEth ? 'Enabled' : 'Disabled'}</p>
            <p className="text-gray-700">USDT Buying: {presaleData.enableBuyWithUsdt ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-bold">Contract Balances</h3>
            <p className="text-gray-700">BNB: {balances.bnb}</p>
            <p className="text-gray-700">USDT: {balances.usdt}</p>
            <p className="text-gray-700">UWT: {balances.uwt}</p>
          </div>
        </div>
      </div>

      {/* Create Presale */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Create Presale</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Start Date & Time
          </label>
          <div className="flex gap-4">
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            End Date & Time
          </label>
          <div className="flex gap-4">
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Token Price (in BNB)
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="0.1"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Total Tokens
          </label>
          <input
            type="number"
            name="totalTokens"
            value={formData.totalTokens}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="1000000"
          />
        </div>

        <button
          onClick={handleCreatePresale}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create Presale
        </button>
      </div>

      {/* Update Settings */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Update Settings</h2>
        
        {/* Change Price */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            New Price (in BNB)
          </label>
          <div className="flex gap-4">
            <input
              type="number"
              name="newPrice"
              value={formData.newPrice}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              onClick={handleChangePrice}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Update Price
            </button>
          </div>
        </div>

        {/* Change Vesting Start */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            New Vesting Start Date & Time
          </label>
          <div className="flex gap-4">  
            <input
              type="date" 
              name="newVestingStartDate"
              value={formData.newVestingStartDate}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <input
              type="time"
              name="newVestingStartTime" 
              value={formData.newVestingStartTime}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              onClick={handleChangeVestingStartTime}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Update Vesting Start
            </button>
          </div>
        </div>

        {/* Toggle Functions */}
        <div className="mb-4 flex gap-4">
          <button
            onClick={handleToggleBuyWithEth}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            {presaleData.enableBuyWithEth ? 'Disable' : 'Enable'} BNB Buying
          </button>
          <button
            onClick={handleToggleBuyWithUsdt}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            {presaleData.enableBuyWithUsdt ? 'Disable' : 'Enable'} USDT Buying
          </button>
          <button
            onClick={handleTogglePause}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            {presaleData.isPaused ? 'Unpause' : 'Pause'} Presale
          </button>
        </div>
      </div>

      {/* Withdrawals */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
        <div className="flex gap-4">
          <button
            onClick={handleWithdrawTokens}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Withdraw Remaining Tokens
          </button>
          <button
            onClick={handleWithdrawBNB}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Withdraw BNB
          </button>
          <button
            onClick={handleWithdrawUSDT}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Withdraw USDT
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnerConfig;