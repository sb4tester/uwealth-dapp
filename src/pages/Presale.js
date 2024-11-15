import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';
import presaleABIImport from '../contracts/UWealthPresale.json';
import tokenABIImport from '../contracts/UWealthToken.json';
import USDTABIImport from '../contracts/MockUSDT.json';

function Presale() {
  const { web3, account, checkNetwork } = useContext(Web3Context);
  const [presaleContract, setPresaleContract] = useState(null);
  const [tokenContract, setTokenContract] = useState(null);
  const [usdtContract, setUsdtContract] = useState(null);
  const [presaleStatus, setPresaleStatus] = useState('');
  const [tokensAvailable, setTokensAvailable] = useState('0');
  const [tokensSold, setTokensSold] = useState('0');
  const [userContribution, setUserContribution] = useState({ total: '0' });
  const [bnbBalance, setBnbBalance] = useState('0');
  const [usdtBalance, setUsdtBalance] = useState('0');
  const [amount, setAmount] = useState('');
  const [tokenRate, setTokenRate] = useState({ bnb: '0', usdt: '0' });
  const [minPurchaseUSDT, setMinPurchaseUSDT] = useState('0');
  const [maxPurchaseUSDT, setMaxPurchaseUSDT] = useState('0');
  const [minPurchaseBNB, setMinPurchaseBNB] = useState('0');
  const [maxPurchaseBNB, setMaxPurchaseBNB] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('BNB');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [transactionStatus, setTransactionStatus] = useState('');

  const updatePresaleInfo = useCallback(async () => {
    if (!presaleContract || !account || !web3) return;

    try {
      setIsLoading(true);
      const [
        startTime,
        endTime,
        totalSold,
        userPurchase,
        TOKENS_PER_USDT,
        TOKENS_PER_BNB,
        MIN_PURCHASE_USDT,
        MAX_PURCHASE_USDT,
        MIN_PURCHASE_BNB,
        MAX_PURCHASE_BNB,
        PRESALE_SUPPLY
      ] = await Promise.all([
        presaleContract.methods.startTime().call(),
        presaleContract.methods.endTime().call(),
        presaleContract.methods.totalTokensSold().call(),
        presaleContract.methods.purchases(account).call(),
        presaleContract.methods.tokensPerUSDT().call(),
        presaleContract.methods.tokensPerBNB().call(),
        presaleContract.methods.minPurchaseUSDT().call(),
        presaleContract.methods.maxPurchaseUSDT().call(),
        presaleContract.methods.minPurchaseBNB().call(),
        presaleContract.methods.maxPurchaseBNB().call(),
        presaleContract.methods.PRESALE_SUPPLY().call()
      ]);

      const now = Math.floor(Date.now() / 1000);
      const status = now < startTime ? 'Not started' : now > endTime ? 'Ended' : 'Active';
      setPresaleStatus(status);

      setTokensAvailable(web3.utils.fromWei(PRESALE_SUPPLY, 'ether'));
      setTokensSold(web3.utils.fromWei(totalSold, 'ether'));
      setUserContribution({ total: web3.utils.fromWei(userPurchase, 'ether') });
      setTokenRate({
        usdt: web3.utils.fromWei(TOKENS_PER_USDT, 'ether'),
        bnb: web3.utils.fromWei(TOKENS_PER_BNB, 'ether')
      });
      setMinPurchaseUSDT(web3.utils.fromWei(MIN_PURCHASE_USDT, 'mwei'));
      setMaxPurchaseUSDT(web3.utils.fromWei(MAX_PURCHASE_USDT, 'mwei'));
      setMinPurchaseBNB(web3.utils.fromWei(MIN_PURCHASE_BNB, 'ether'));
      setMaxPurchaseBNB(web3.utils.fromWei(MAX_PURCHASE_BNB, 'ether'));
    } catch (error) {
      console.error("Error updating presale info:", error);
    } finally {
      setIsLoading(false);
    }
  }, [presaleContract, account, web3]);

  const updateUserBalances = useCallback(async () => {
    if (!web3 || !account || !usdtContract) return;
    try {
      const [bnbBal, usdtBal] = await Promise.all([
        web3.eth.getBalance(account),
        usdtContract.methods.balanceOf(account).call()
      ]);
      setBnbBalance(web3.utils.fromWei(bnbBal, 'ether'));
      setUsdtBalance(web3.utils.fromWei(usdtBal, 'mwei'));
    } catch (error) {
      console.error("Error updating user balances:", error);
    }
  }, [web3, account, usdtContract]);

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

        setPresaleContract(new web3.eth.Contract(presaleABIImport.abi, presaleNetworkData.address));
        setTokenContract(new web3.eth.Contract(tokenABIImport.abi, tokenNetworkData.address));
        setUsdtContract(new web3.eth.Contract(USDTABIImport.abi, usdtNetworkData.address));
      } catch (error) {
        console.error("Error initializing contracts:", error);
        alert("Error initializing contracts. Please check your network connection and try again.");
      }
    };

    initializeContracts();
  }, [web3]);

  useEffect(() => {
    if (presaleContract && account) {
      updatePresaleInfo();
      updateUserBalances();
      const intervalId = setInterval(() => {
        updatePresaleInfo();
        updateUserBalances();
      }, 30000); // Update every 30 seconds
      return () => clearInterval(intervalId);
    }
  }, [presaleContract, account, updatePresaleInfo, updateUserBalances]);

  useEffect(() => {
    const checkOwnership = async () => {
      if (presaleContract && account) {
        try {
          const owner = await presaleContract.methods.owner().call();
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (error) {
          console.error("Error checking ownership:", error);
        }
      }
    };

    checkOwnership();
  }, [presaleContract, account]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value && !isNaN(value)) {
      const tokens = parseFloat(value) * parseFloat(tokenRate[selectedCurrency.toLowerCase()]);
      setEstimatedTokens(tokens.toFixed(2));
    } else {
      setEstimatedTokens('0');
    }
  };

  const handleCurrencyChange = () => {
    setSelectedCurrency(selectedCurrency === 'BNB' ? 'USDT' : 'BNB');
    setAmount('');
    setEstimatedTokens('0');
  };
  
  const checkBNBForGas = useCallback(async () => {
	  if (!web3 || !account) return false;
	  try {
	    const balance = await web3.eth.getBalance(account);
	    const gasPrice = await web3.eth.getGasPrice();
	    const estimatedGas = 21000; // ประมาณการณ์ค่าแก๊สขั้นต่ำ
	    const requiredBNB = parseFloat(gasPrice) * estimatedGas;
	    console.log("BNB balance check:", { balance, gasPrice, estimatedGas, requiredBNB });
	    return parseFloat(balance) >= requiredBNB;
	  } catch (error) {
	    console.error("Error checking BNB for gas:", error);
	    return false;
	  }
	}, [web3, account]);

  const handleBuyWithBNB = async () => {
	    console.log("1. Starting handleBuyWithBNB");
	    if (!presaleContract || !account) {
	      console.error("2. Missing required data for BNB purchase");
	      alert("Unable to process purchase. Please check your connection and try again.");
	      return;
	    }

	    console.log("3. Checking network");
	    const isCorrectNetwork = await checkNetwork();
	    if (!isCorrectNetwork) {
	      console.log("4. Incorrect network");
	      return;
	    }

	    if (presaleStatus !== 'Active') {
	      console.log("5. Presale is not active");
	      alert("Presale is not active at the moment.");
	      return;
	    }

	    const hasSufficientBNB = await checkBNBForGas();
	    if (!hasSufficientBNB) {
	      alert("Insufficient BNB for gas fees. Please add more BNB to your account.");
	      return;
	    }

	    setIsPurchasing(true);
	    setTransactionStatus('Processing BNB purchase...');

	    try {
	      const amountWei = web3.utils.toWei(amount, 'ether');
	      
	      if (parseFloat(amount) < parseFloat(minPurchaseBNB)) {
	        throw new Error(`Amount is below minimum purchase of ${minPurchaseBNB} BNB`);
	      }
	      
	      if (parseFloat(amount) > parseFloat(maxPurchaseBNB)) {
	        throw new Error(`Amount is above maximum purchase of ${maxPurchaseBNB} BNB`);
	      }

	      console.log("6. Preparing BNB purchase transaction");
	      console.log("Contract address:", presaleContract.options.address);
	      console.log("Account:", account);
	      console.log("Amount Wei:", amountWei);

	      console.log("Sending transaction with fixed gas limit");
	        const tx = await presaleContract.methods.buyTokensWithBNB().send({
	            from: account,
	            value: amountWei,
	            gas: 900000, // กำหนดค่า gas limit ที่สูงพอ
	        });

	      console.log('8. Transaction successful:', tx.transactionHash);
	      setTransactionStatus('Purchase successful!');
	      await updatePresaleInfo();
	      await updateUserBalances();
	      setAmount('');
	      alert("Purchase successful!");
	    } catch (error) {
	      console.error("9. Error buying tokens with BNB:", error);
	      let errorMessage = "An unknown error occurred.";
	      if (error.message.includes("User denied transaction")) {
	        errorMessage = "Transaction was cancelled.";
	      } else if (error.message.includes("insufficient funds")) {
	        errorMessage = "Insufficient funds for gas * price + value.";
	      } else if (error.message.includes("execution reverted")) {
	        errorMessage = "Transaction reverted by the contract. Please check contract conditions.";
	      }
	      setTransactionStatus(`Error: ${errorMessage}`);
	      alert(`An error occurred: ${errorMessage}`);
	    } finally {
	      setIsPurchasing(false);
	    }
	};

	const handleBuyWithUSDT = async () => {
	    console.log("1. Starting handleBuyWithUSDT");
	    if (!presaleContract || !usdtContract || !account) {
	      console.error("2. Missing required data for USDT purchase");
	      alert("Unable to process purchase. Please check your connection and try again.");
	      return;
	    }

	    console.log("3. Checking network");
	    const isCorrectNetwork = await checkNetwork();
	    if (!isCorrectNetwork) {
	      console.log("4. Incorrect network");
	      return;
	    }

	    if (presaleStatus !== 'Active') {
	      console.log("5. Presale is not active");
	      alert("Presale is not active at the moment.");
	      return;
	    }

	    try {
	      const amountWei = web3.utils.toWei(amount, 'mwei'); // USDT uses 6 decimals
	      
	      // Check USDT balance
	      const usdtBalance = await usdtContract.methods.balanceOf(account).call();
	      console.log("USDT Balance:", web3.utils.fromWei(usdtBalance, 'mwei'), "USDT");
	      if (parseFloat(web3.utils.fromWei(usdtBalance, 'mwei')) < parseFloat(amount)) {
	        alert("Insufficient USDT balance");
	        return;
	      }

	      // Check UWT balance in presale contract
	      const uwtBalance = await uwtToken.methods.balanceOf(presaleContract.options.address).call();
	      const tokenAmount = parseFloat(amount) * parseFloat(tokensPerUSDT);
	      console.log("UWT Balance in contract:", web3.utils.fromWei(uwtBalance, 'ether'), "UWT");
	      console.log("Token amount to purchase:", tokenAmount, "UWT");
	      if (parseFloat(web3.utils.fromWei(uwtBalance, 'ether')) < tokenAmount) {
	        alert("Insufficient UWT tokens in presale contract");
	        return;
	      }

	      setIsApproving(true);
	      setTransactionStatus('Checking USDT allowance...');
	      console.log("6. Checking USDT allowance");
	      const allowance = await usdtContract.methods.allowance(account, presaleContract.options.address).call();
	      console.log("Current allowance:", web3.utils.fromWei(allowance, 'mwei'), "USDT");
	      if (parseFloat(web3.utils.fromWei(allowance, 'mwei')) < parseFloat(amount)) {
	        console.log("7. Approving USDT");
	        setTransactionStatus('Approving USDT...');
	        const approveTx = await usdtContract.methods.approve(presaleContract.options.address, amountWei).send({ from: account });
	        console.log('Approval transaction:', approveTx.transactionHash);
	      }
	      setIsApproving(false);

	      setIsPurchasing(true);
	      setTransactionStatus('Processing USDT purchase...');
	      console.log("8. Sending USDT purchase transaction");
	      const tx = await presaleContract.methods.buyTokensWithUSDT(amountWei).send({ 
	        from: account,
	        gas: 500000 // Fixed gas value
	      });

	      console.log('9. Purchase successful:', tx.transactionHash);
	      setTransactionStatus('Purchase successful!');
	      await updatePresaleInfo();
	      await updateUserBalances();
	      setAmount('');
	      alert("Purchase successful!");
	    } catch (error) {
	      console.error("10. Error buying tokens with USDT:", error);
	      setTransactionStatus(`Error: ${error.message}`);
	      alert(`An error occurred: ${error.message}`);
	    } finally {
	      setIsApproving(false);
	      setIsPurchasing(false);
	    }
	};

  const handleBuy = async () => {
    if (selectedCurrency === 'BNB') {
      await handleBuyWithBNB();
    } else {
      await handleBuyWithUSDT();
    }
  };

  const progressPercentage = (parseFloat(tokensSold) / parseFloat(tokensAvailable)) * 100;

	return (
		    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
		      <div className="bg-[#1e2a3a] rounded-lg shadow-xl p-6 w-full max-w-md">
		        <h2 className="text-2xl font-bold text-white mb-4">Presale Status : {presaleStatus}</h2>
		        <div className="mb-4">
		        <label className="block text-gray-400 mb-2">
		          You send (min: {selectedCurrency === 'BNB' ? minPurchaseBNB : minPurchaseUSDT}, 
		          max: {selectedCurrency === 'BNB' ? maxPurchaseBNB : maxPurchaseUSDT})
		        </label>
		        <div className="flex bg-[#2a3a4a] rounded-md">
		          <input
		            type="number"
		            value={amount}
		            onChange={handleAmountChange}
		            className="bg-transparent text-white p-2 w-full focus:outline-none"
		            placeholder="0.0"
		          />
		          <button
		            onClick={handleCurrencyChange}
		            className="text-white p-2 flex items-center"
		          >
		            <img 
		              src={selectedCurrency === 'BNB' ? "/images/bnb-logo.png" : "/images/usdt-logo.png"} 
		              alt={selectedCurrency} 
		              className="w-6 h-6 mr-2"
		            />
		            {selectedCurrency} ▼
		          </button>
		        </div>
		        </div>
		        <div className="mb-4 text-gray-400">
		          = 1 {selectedCurrency} → {tokenRate[selectedCurrency.toLowerCase()]} UWT
		        </div>
			<div className="mb-4">
			<label className="block text-gray-400 mb-2">You get</label>
	        <div className="flex bg-[#2a3a4a] rounded-md">
	          <input
	            type="number"
	            value={estimatedTokens}
	            readOnly
	            className="bg-transparent text-white p-2 w-full focus:outline-none"
	          />
	          <div className="text-white p-2 flex items-center">
	            <img 
	              src="/images/uwt-logo.png" 
	              alt="UWT" 
	              className="w-6 h-6 mr-2"
	            />
	            UWT
	          </div>
	        </div>
			</div>
			<div className="mb-4">
			<div className="flex justify-between text-gray-400">
			<span>${parseFloat(tokensSold).toLocaleString()}</span>
			<span>${parseFloat(tokensAvailable).toLocaleString()}</span>
			</div>
			<div className="w-full bg-gray-700 rounded-full h-2.5">
			<div 
			className="bg-green-500 h-2.5 rounded-full" 
				style={{ width: `${progressPercentage}%` }}
			></div>
			</div>
			<div className="text-right text-gray-400 mt-1">
			{progressPercentage.toFixed(2)}%
			</div>
			</div>
			{account ? (
					<button
					onClick={handleBuy}
					className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
						disabled={isLoading || isApproving || isPurchasing}
					>
					{isApproving ? 'Approving...' : isPurchasing ? 'Processing...' : 'Buy UWT'}
					</button>
			) : (
					<button
					onClick={checkNetwork}
					className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
						>
					Connect Wallet
					</button>
			)}
			{transactionStatus && (
					  <p className="mt-4 text-center text-white">{transactionStatus}</p>
					)}
			{isOwner && (
					<Link 
					to="/owner-config" 
						className="block mt-4 text-center bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
							>
					Owner Settings
					</Link>
			)}
			</div>
			</div>
	);
}

export default Presale;