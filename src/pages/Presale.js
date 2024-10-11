import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Web3Context } from '../contexts/Web3Context';
import presaleABIImport from '../contracts/UWealthPresale.json';
import tokenABIImport from '../contracts/UWealthToken.json';
import USDTABIImport from '../contracts/MockUSDT.json';

function Presale() {
  const { web3, account } = useContext(Web3Context);
  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [usdtContract, setUsdtContract] = useState(null);
  const [presaleStatus, setPresaleStatus] = useState('');
  const [tokensAvailable, setTokensAvailable] = useState('0');
  const [tokensSold, setTokensSold] = useState('0');
  const [userContribution, setUserContribution] = useState({ total: '0' });
  const [bnbBalance, setBnbBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [bnbAmount, setBnbAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');
  const [tokenRate, setTokenRate] = useState({ bnb: '0', usdt: '0' });
  const [tokensPerUSDT, setTokensPerUSDT] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const fetchBNBPrice = useCallback(async () => {
    // ใช้ราคาคงที่ชั่วคราว
    return 530; // สมมติว่า 1 BNB = 300 USD
  }, []);

  const updateBNBRate = useCallback(async (usdtRate) => {
    try {
      const bnbPrice = await fetchBNBPrice();
      const usdtRateNumber = parseFloat(usdtRate);
      const bnbRate = bnbPrice * usdtRateNumber;
      
      console.log('Fixed BNB Price:', bnbPrice, 'USDT Rate:', usdtRateNumber, 'Calculated BNB Rate:', bnbRate);
      
      setTokenRate(prevState => ({ 
        ...prevState, 
        bnb: bnbRate.toString()
      }));
    } catch (error) {
      console.error('Error updating BNB rate:', error);
      setTokenRate(prevState => ({ ...prevState, bnb: prevState.bnb || '0' }));
    }
  }, [fetchBNBPrice]);

  const updatePresaleInfo = useCallback(async () => {
    if (!presaleContract || !account) return;

    try {
      const [startTime, endTime, totalSold, userPurchase, TOKENS_PER_USDT] = await Promise.all([
        presaleContract.methods.startTime().call(),
        presaleContract.methods.endTime().call(),
        presaleContract.methods.totalTokensSold().call(),
        presaleContract.methods.purchases(account).call(),
        presaleContract.methods.TOKENS_PER_USDT().call()
      ]);

      const now = Math.floor(Date.now() / 1000);
      setPresaleStatus(now < startTime ? 'Not started' : now > endTime ? 'Ended' : 'Active');

      const totalSupply = await presaleContract.methods.PRESALE_SUPPLY().call();
      setTokensAvailable(web3.utils.fromWei(totalSupply, 'ether'));
      setTokensSold(web3.utils.fromWei(totalSold, 'ether'));
      setUserContribution({ total: web3.utils.fromWei(userPurchase, 'ether') });
      setTokensPerUSDT(TOKENS_PER_USDT);
      setTokenRate(prevState => ({ ...prevState, usdt: web3.utils.fromWei(TOKENS_PER_USDT, 'ether') }));

      await updateBNBRate(TOKENS_PER_USDT);
    } catch (error) {
      console.error("Error updating presale info:", error);
      if (error.message.includes("Internal JSON-RPC error")) {
        alert("There was an error connecting to the blockchain. Please check your network connection and try again.");
      }
    }
  }, [presaleContract, account, web3, updateBNBRate]);

  const updateUserBalances = useCallback(async () => {
    try {
      const [bnbBal, usdtBal] = await Promise.all([
        web3.eth.getBalance(account),
        usdtContract.methods.balanceOf(account).call()
      ]);
      setBnbBalance(web3.utils.fromWei(bnbBal, 'ether'));
      setUsdtBalance(web3.utils.fromWei(usdtBal, 'mwei')); // MockUSDT uses 6 decimals
    } catch (error) {
      console.error("Error updating user balances:", error);
    }
  }, [web3, account, usdtContract]);

  const checkRates = useCallback(async () => {
    if (!presaleContract) return;
    try {
      const [bnbRate, usdtRate] = await Promise.all([
        presaleContract.methods.tokensPerBNB().call(),
        presaleContract.methods.TOKENS_PER_USDT().call()
      ]);
      
      console.log('BNB Rate:', web3.utils.fromWei(bnbRate, 'ether'), 'UWT per BNB');
      console.log('USDT Rate:', usdtRate, 'UWT per USDT');

      setTokensPerUSDT(usdtRate);
      setTokenRate(prevState => ({ ...prevState, usdt: usdtRate }));
      await updateBNBRate(usdtRate);
    } catch (error) {
      console.error('Error checking rates:', error);
    }
  }, [presaleContract, web3, updateBNBRate]);

  useEffect(() => {
    const checkNetwork = async () => {
      if (web3) {
        try {
          const networkId = await web3.eth.net.getId();
          const expectedNetworkId = 97; // Binance Smart Chain Testnet
          if (networkId !== expectedNetworkId) {
            alert(`Please connect to Binance Smart Chain Testnet (Network ID: ${expectedNetworkId})`);
          }
        } catch (error) {
          console.error("Error checking network:", error);
        }
      }
    };

    checkNetwork();
  }, [web3]);

  useEffect(() => {
    const initializeContracts = async () => {
      if (!web3) return;
      try {
        const networkId = await web3.eth.net.getId();
        const presaleNetworkData = presaleABIImport.networks[networkId];
        const tokenNetworkData = tokenABIImport.networks[networkId];
        const usdtNetworkData = USDTABIImport.networks[networkId];

        if (!presaleNetworkData || !tokenNetworkData || !usdtNetworkData) {
          throw new Error("One or more contracts not deployed on the current network");
        }

        const presaleContractInstance = new web3.eth.Contract(presaleABIImport.abi, presaleNetworkData.address);
        const tokenContractInstance = new web3.eth.Contract(tokenABIImport.abi, tokenNetworkData.address);
        const usdtContractInstance = new web3.eth.Contract(USDTABIImport.abi, usdtNetworkData.address);
        
        setPresaleContract(presaleContractInstance);
        setTokenContract(tokenContractInstance);
        setUsdtContract(usdtContractInstance);
      } catch (error) {
        console.error("Error initializing contracts:", error);
        alert("Error initializing contracts. Please check your network connection and try again.");
      }
    };

    initializeContracts();
  }, [web3]);

  useEffect(() => {
    const updateAllInfo = async () => {
      if (presaleContract && account) {
        setIsLoading(true);
        try {
          await updatePresaleInfo();
          await updateUserBalances();
          await checkRates();
        } catch (error) {
          console.error("Error updating info:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (presaleContract && account) {
      updateAllInfo();
      const intervalId = setInterval(updateAllInfo, 300000); // อัพเดททุก 5 นาที
      return () => clearInterval(intervalId);
    }
  }, [presaleContract, account, updatePresaleInfo, updateUserBalances, checkRates]);

  useEffect(() => {
    if (presaleContract) {
      const tokensPurchasedEvent = presaleContract.events.TokensPurchased({ fromBlock: 'latest' });
      tokensPurchasedEvent.on('data', async (event) => {
        console.log('Tokens Purchased Event:', event.returnValues);
        await updatePresaleInfo();
        await updateUserBalances();
      });

      return () => {
        tokensPurchasedEvent.removeAllListeners();
      };
    }
  }, [presaleContract, updatePresaleInfo, updateUserBalances]);

  const handleBuyWithBNB = async () => {
    if (!presaleContract || !account || !bnbAmount) return;
    try {
      const amountWei = web3.utils.toWei(bnbAmount, 'ether');
      const [minPurchase, maxPurchase] = await Promise.all([
        presaleContract.methods.minPurchaseBNB().call(),
        presaleContract.methods.maxPurchaseBNB().call()
      ]);
      
      if (amountWei < minPurchase || amountWei > maxPurchase) {
        alert("Amount is outside purchase limits");
        return;
      }
      
      const gasEstimate = await presaleContract.methods.buyTokensWithBNB().estimateGas({ from: account, value: amountWei });
      const tx = await presaleContract.methods.buyTokensWithBNB().send({ 
        from: account, 
        value: amountWei,
        gas: Math.floor(gasEstimate * 1.5) // เพิ่ม gas limit เป็น 50%
      });

      console.log('Transaction successful:', tx.transactionHash);
      await web3.eth.getTransactionReceipt(tx.transactionHash);
      
      await updatePresaleInfo();
      await updateUserBalances();
      setBnbAmount('');
    } catch (error) {
      console.error("Error buying tokens with BNB:", error);
      alert("Transaction failed. Please check your balance and try again.");
    }
  };

  const handleBuyWithUSDT = async () => {
    if (!presaleContract || !usdtContract || !account || !usdtAmount) return;
    try {
      const amountWei = web3.utils.toWei(usdtAmount, 'mwei'); // USDT uses 6 decimals
      const [MIN_PURCHASE, MAX_PURCHASE] = await Promise.all([
        presaleContract.methods.MIN_PURCHASE_USDT().call(),
        presaleContract.methods.MAX_PURCHASE_USDT().call()
      ]);
      
      if (amountWei < MIN_PURCHASE || amountWei > MAX_PURCHASE) {
        alert("Amount is outside purchase limits");
        return;
      }
      
      const approveGasEstimate = await usdtContract.methods.approve(presaleContract.options.address, amountWei).estimateGas({ from: account });
      const approveTx = await usdtContract.methods.approve(presaleContract.options.address, amountWei).send({ 
        from: account,
        gas: Math.floor(approveGasEstimate * 1.5)
      });
      console.log('Approval successful:', approveTx.transactionHash);

      const buyGasEstimate = await presaleContract.methods.buyTokensWithUSDT(amountWei).estimateGas({ from: account });
      const buyTx = await presaleContract.methods.buyTokensWithUSDT(amountWei).send({ 
        from: account,
        gas: Math.floor(buyGasEstimate * 1.5)
      });
      console.log('Purchase successful:', buyTx.transactionHash);

      await web3.eth.getTransactionReceipt(buyTx.transactionHash);

      await updatePresaleInfo();
      await updateUserBalances();
      setUsdtAmount('');
    } catch (error) {
      console.error("Error buying tokens with USDT:", error);
      alert("Transaction failed. Please check your balance and try again.");
    }
  };

  const calculateSoldPercentage = () => {
    const available = parseFloat(tokensAvailable);
    const sold = parseFloat(tokensSold);
    if (available === 0) return 0;
    return (sold / available) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">UWealth Presale</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <p>Presale Status: {presaleStatus}</p>
          <p>Your Total Contribution: {userContribution.total} (BNB + USDT equivalent)</p>
          <div className="mt-4">
            <p className="mb-2">Tokens Sold: {Number(tokensSold).toLocaleString()} / {Number(tokensAvailable).toLocaleString()} UWT</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{width: `${calculateSoldPercentage()}%`}}
              ></div>
            </div>
            <p className="mt-1 text-sm text-gray-500">{calculateSoldPercentage().toFixed(2)}% Sold</p>
          </div>
        </div>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2 mb-4">
            <h2 className="text-xl font-bold mb-2">Buy with BNB</h2>
            <p>BNB Rate: 1 BNB = {parseFloat(tokenRate.bnb).toFixed(2)} UWT</p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bnbAmount">
                Amount ({bnbBalance} BNB available)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="bnbAmount"
                type="number"
                placeholder={`Enter amount (max ${bnbBalance} BNB)`}
                value={bnbAmount}
                onChange={(e) => setBnbAmount(e.target.value)}
              />
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleBuyWithBNB}
              disabled={presaleStatus !== 'Active'}
            >
              Buy with BNB
            </button>
          </div>
          <div className="w-full md:w-1/2 px-2 mb-4">
            <h2 className="text-xl font-bold mb-2">Buy with USDT</h2>
            <p>USDT Rate: 1 USDT ={parseFloat(tokenRate.usdt).toFixed(2)} UWT</p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="usdtAmount">
                Amount ({usdtBalance} USDT available)
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="usdtAmount"
                type="number"
                placeholder={`Enter amount (max ${usdtBalance} USDT)`}
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
              />
            </div>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleBuyWithUSDT}
              disabled={presaleStatus !== 'Active'}
            >
              Buy with USDT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Presale;