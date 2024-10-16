import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';
import presaleABIImport from '../contracts/UWealthPresale.json';
import tokenABIImport from '../contracts/UWealthToken.json';
import USDTABIImport from '../contracts/MockUSDT.json';
import config from '../config/config';

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
	const [bnbAmount, setBnbAmount] = useState('');
	const [usdtAmount, setUsdtAmount] = useState('');
	const [tokenRate, setTokenRate] = useState({ bnb: '0', usdt: '0' });
	const [tokensPerUSDT, setTokensPerUSDT] = useState('0');
	const [isLoading, setIsLoading] = useState(false);
	const [isApproving, setIsApproving] = useState(false);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [newEndTime, setNewEndTime] = useState('');
	const [minPurchaseUSDT, setMinPurchaseUSDT] = useState('0');
	const [maxPurchaseUSDT, setMaxPurchaseUSDT] = useState('0');
	const [minPurchaseBNB, setMinPurchaseBNB] = useState('0');
	const [maxPurchaseBNB, setMaxPurchaseBNB] = useState('0');

	const fetchBNBPrice = useCallback(async () => {
		// ใช้ราคาคงที่ชั่วคราว
		return 530; // สมมติว่า 1 BNB = 530 USD
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
			const [
				startTime,
				endTime,
				totalSold,
				userPurchase,
				TOKENS_PER_USDT,
				MIN_PURCHASE_USDT,
				MAX_PURCHASE_USDT,
				MIN_PURCHASE_BNB,
				MAX_PURCHASE_BNB
				] = await Promise.all([
					presaleContract.methods.startTime().call(),
					presaleContract.methods.endTime().call(),
					presaleContract.methods.totalTokensSold().call(),
					presaleContract.methods.purchases(account).call(),
					presaleContract.methods.TOKENS_PER_USDT().call(),
					presaleContract.methods.MIN_PURCHASE_USDT().call(),
					presaleContract.methods.MAX_PURCHASE_USDT().call(),
					presaleContract.methods.minPurchaseBNB().call(),
					presaleContract.methods.maxPurchaseBNB().call()
					]);

			const now = Math.floor(Date.now() / 1000);
			const status = now < startTime ? 'Not started' : now > endTime ? 'Ended' : 'Active';
			setPresaleStatus(status);
			console.log("Presale status:", status);

			const totalSupply = await presaleContract.methods.PRESALE_SUPPLY().call();
			const availableTokens = web3.utils.fromWei(totalSupply, 'ether');
			const soldTokens = web3.utils.fromWei(totalSold, 'ether');
			setTokensAvailable(availableTokens);
			setTokensSold(soldTokens);
			console.log("Tokens available:", availableTokens);
			console.log("Tokens sold:", soldTokens);

			setUserContribution({ total: web3.utils.fromWei(userPurchase, 'ether') });
			setTokensPerUSDT(TOKENS_PER_USDT);
			setTokenRate(prevState => ({ ...prevState, usdt: web3.utils.fromWei(TOKENS_PER_USDT, 'ether') }));

			await updateBNBRate(TOKENS_PER_USDT);

			setMinPurchaseUSDT(web3.utils.fromWei(MIN_PURCHASE_USDT, 'mwei'));
			setMaxPurchaseUSDT(web3.utils.fromWei(MAX_PURCHASE_USDT, 'mwei'));
			setMinPurchaseBNB(web3.utils.fromWei(MIN_PURCHASE_BNB, 'ether'));
			setMaxPurchaseBNB(web3.utils.fromWei(MAX_PURCHASE_BNB, 'ether'));

			console.log("Min Purchase USDT:", web3.utils.fromWei(MIN_PURCHASE_USDT, 'mwei'));
			console.log("Max Purchase USDT:", web3.utils.fromWei(MAX_PURCHASE_USDT, 'mwei'));
			console.log("Min Purchase BNB:", web3.utils.fromWei(MIN_PURCHASE_BNB, 'ether'));
			console.log("Max Purchase BNB:", web3.utils.fromWei(MAX_PURCHASE_BNB, 'ether'));

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
			const bnbBalance = web3.utils.fromWei(bnbBal, 'ether');
			const usdtBalance = web3.utils.fromWei(usdtBal, 'mwei'); // MockUSDT uses 6 decimals
			setBnbBalance(bnbBalance);
			setUsdtBalance(usdtBalance);
			console.log("User BNB balance:", bnbBalance);
			console.log("User USDT balance:", usdtBalance);
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
		checkNetwork();
	}, [checkNetwork]);

	useEffect(() => {
		const initializeContracts = async () => {
			console.log("Initializing contracts. Web3 status:", web3 ? "Available" : "Not available");
			if (!web3) return;
			try {
				const networkId = await web3.eth.net.getId();
				console.log("Current Network ID:", networkId);

				const presaleNetworkData = presaleABIImport.networks[networkId];
				const tokenNetworkData = tokenABIImport.networks[networkId];
				const usdtNetworkData = USDTABIImport.networks[networkId];

				console.log("Presale Network Data:", presaleNetworkData);
				console.log("Token Network Data:", tokenNetworkData);
				console.log("USDT Network Data:", usdtNetworkData);

				if (!presaleNetworkData || !tokenNetworkData || !usdtNetworkData) {
					throw new Error("One or more contracts not deployed on the current network");
				}

				const presaleContractInstance = new web3.eth.Contract(presaleABIImport.abi, presaleNetworkData.address);
				const tokenContractInstance = new web3.eth.Contract(tokenABIImport.abi, tokenNetworkData.address);
				const usdtContractInstance = new web3.eth.Contract(USDTABIImport.abi, usdtNetworkData.address);

				setPresaleContract(presaleContractInstance);
				setTokenContract(tokenContractInstance);
				setUsdtContract(usdtContractInstance);

				console.log("Presale contract initialized:", presaleContractInstance.options.address);
				console.log("Token contract initialized:", tokenContractInstance.options.address);
				console.log("USDT contract initialized:", usdtContractInstance.options.address);
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

	const handleRestartPresale = async () => {
		if (!presaleContract || !isOwner) return;
		try {
			const now = Math.floor(Date.now() / 1000);
			const duration = 7 * 24 * 60 * 60; // 7 days in seconds
			const tokensPerBNB = web3.utils.toWei('1000', 'ether'); // Example: 1000 tokens per BNB
			const minPurchaseBNB = web3.utils.toWei('0.1', 'ether'); // Example: 0.1 BNB
			const maxPurchaseBNB = web3.utils.toWei('10', 'ether'); // Example: 10 BNB

			const tx = await presaleContract.methods.startPresale(
					duration,
					tokensPerBNB,
					minPurchaseBNB,
					maxPurchaseBNB
			).send({ from: account });

			console.log('Presale restarted:', tx.transactionHash);
			await updatePresaleInfo();
		} catch (error) {
			console.error("Error restarting presale:", error);
			alert("Failed to restart presale. Check console for details.");
		}
	};

	const handleExtendPresale = async () => {
		if (!presaleContract || !isOwner || !newEndTime) return;
		try {
			const newEndTimeUnix = Math.floor(new Date(newEndTime).getTime() / 1000);
			const tx = await presaleContract.methods.setEndTime(newEndTimeUnix).send({ from: account });
			console.log('Presale extended:', tx.transactionHash);
			await updatePresaleInfo();
		} catch (error) {
			console.error("Error extending presale:", error);
			alert("Failed to extend presale. Check console for details.");
		}
	};

	const checkAndApproveUSDT = async (amount) => {
		const amountWei = web3.utils.toWei(amount, 'mwei');
		const allowance = await usdtContract.methods.allowance(account, presaleContract.options.address).call();

		console.log("Amount to approve:", amountWei);
		console.log("Current allowance:", allowance);

		if (parseFloat(allowance) < parseFloat(amountWei)) {
			console.log("Allowance is insufficient. Approving new amount...");
			return await approveUSDT(amount);
		}

		console.log('Allowance is sufficient, no need to approve');
		return null;
	};

	const approveUSDT = async (amount) => {
		const amountWei = web3.utils.toWei(amount, 'mwei');
		try {
			const approveGasEstimate = await usdtContract.methods.approve(presaleContract.options.address, amountWei).estimateGas({ from: account });
			const approveTx = await usdtContract.methods.approve(presaleContract.options.address, amountWei).send({ 
				from: account,
				gas: Math.floor(approveGasEstimate * 1.5)
			});
			console.log('Approval successful:', approveTx.transactionHash);
			return approveTx;
		} catch (error) {
			console.error('Error approving USDT:', error);
			throw error;
		}
	};

	const checkPresaleConditions = async () => {
		console.log("3. Checking presale conditions");
		const isCorrectNetwork = await checkNetwork();
		console.log("4. Network check result:", isCorrectNetwork);
		if (!isCorrectNetwork) {
			return false;
		}

		console.log("5. Presale status:", presaleStatus);
		if (presaleStatus !== 'Active') {
			alert("Presale is not active at the moment.");
			return false;
		}

		const hasSufficientBNB = await checkBNBForGas();
		console.log("6. BNB for gas check result:", hasSufficientBNB);
		if (!hasSufficientBNB) {
			alert("Insufficient BNB for gas fees. Please add more BNB to your account.");
			return false;
		}

		return true;
	};

	const checkBNBForGas = async () => {
		const balance = await web3.eth.getBalance(account);
		const gasPrice = await web3.eth.getGasPrice();
		const estimatedGas = 21000; // ประมาณการณ์ค่าแก๊สขั้นต่ำ
		const requiredBNB = parseFloat(gasPrice) * estimatedGas;
		console.log("7. BNB balance check:", { balance, gasPrice, estimatedGas, requiredBNB });
		return parseFloat(balance) >= requiredBNB;
	};

	const handleBuyWithBNB = async () => {
		  console.log("1. Starting handleBuyWithBNB");
		  console.log("Input values:", { bnbAmount, account, presaleContractAddress: presaleContract?.options.address });
		  console.log("Web3 status:", web3 ? "Initialized" : "Not initialized");
		  console.log("Account:", account);

		  if (!presaleContract || !account) {
		    console.error("2. Missing required data for BNB purchase");
		    alert("Unable to process purchase. Please check your connection and try again.");
		    return;
		  }

		  console.log("3. Checking network");
		  const isCorrectNetwork = await checkNetwork();
		  console.log("Network check result:", isCorrectNetwork);
		  if (!isCorrectNetwork) {
		    console.log("4. Incorrect network");
		    return;
		  }

		  console.log("5. Network check passed, continuing with purchase");

		  setIsPurchasing(true);

		  try {
		    console.log("6. Checking blockchain connection");
		    const blockNumber = await web3.eth.getBlockNumber();
		    console.log("Current block number:", blockNumber);

		    console.log("7. Checking account balance");
		    const balance = await web3.eth.getBalance(account);
		    console.log("Account balance:", web3.utils.fromWei(balance, 'ether'), "BNB");

		    console.log("8. Fetching presale contract details");
		    const startTime = await presaleContract.methods.startTime().call();
		    const endTime = await presaleContract.methods.endTime().call();
		    const minPurchaseBNBContract = await presaleContract.methods.minPurchaseBNB().call();
		    const maxPurchaseBNBContract = await presaleContract.methods.maxPurchaseBNB().call();
		    const tokensPerBNB = await presaleContract.methods.tokensPerBNB().call();
		    const presaleSupply = await presaleContract.methods.PRESALE_SUPPLY().call();
		    const totalTokensSold = await presaleContract.methods.totalTokensSold().call();

		    console.log("Presale contract details:", {
		      startTime,
		      endTime,
		      minPurchaseBNBContract: web3.utils.fromWei(minPurchaseBNBContract, 'ether'),
		      maxPurchaseBNBContract: web3.utils.fromWei(maxPurchaseBNBContract, 'ether'),
		      tokensPerBNB: web3.utils.fromWei(tokensPerBNB, 'ether'),
		      presaleSupply: web3.utils.fromWei(presaleSupply, 'ether'),
		      totalTokensSold: web3.utils.fromWei(totalTokensSold, 'ether')
		    });

		    console.log("9. Converting BNB to Wei");
		    const amountWei = web3.utils.toWei(bnbAmount, 'ether');
		    const minPurchaseWei = web3.utils.toWei(minPurchaseBNB, 'ether');
		    const maxPurchaseWei = web3.utils.toWei(maxPurchaseBNB, 'ether');
		    
		    console.log("10. Purchase details:", { amountWei, minPurchaseWei, maxPurchaseWei });

		    if (parseFloat(balance) < parseFloat(amountWei)) {
		      console.log("11. Insufficient balance");
		      alert("Insufficient balance to make this purchase.");
		      return;
		    }

		    if (parseFloat(amountWei) < parseFloat(minPurchaseWei)) {
		      console.log("12. Amount below minimum");
		      alert(`Amount is below minimum purchase limit of ${minPurchaseBNB} BNB`);
		      return;
		    }
		    
		    if (parseFloat(amountWei) > parseFloat(maxPurchaseWei)) {
		      console.log("13. Amount above maximum");
		      alert(`Amount is above maximum purchase limit of ${maxPurchaseBNB} BNB`);
		      return;
		    }

		    console.log("14. Checking UWT token balance of presale contract");
		    const uwtTokenAddress = await presaleContract.methods.uwtToken().call();
		    const uwtTokenContract = new web3.eth.Contract(tokenABIImport.abi, uwtTokenAddress);
		    const presaleUWTBalance = await uwtTokenContract.methods.balanceOf(presaleContract.options.address).call();
		    console.log("Presale contract UWT balance:", web3.utils.fromWei(presaleUWTBalance, 'ether'));

		    console.log("15. Estimating gas for BNB purchase");
		    const gasEstimate = await presaleContract.methods.buyTokensWithBNB().estimateGas({ 
		      from: account, 
		      value: amountWei 
		    });
		    console.log("Estimated gas:", gasEstimate);

		    const gasPrice = await web3.eth.getGasPrice();
		    const adjustedGasPrice = Math.floor(Number(gasPrice) * 1.2); // Increase gas price by 20%
		    console.log("Adjusted gas price:", adjustedGasPrice);

		    console.log("16. Sending BNB purchase transaction");
		    const tx = await presaleContract.methods.buyTokensWithBNB().send({ 
		      from: account, 
		      value: amountWei,
		      gas: Math.floor(gasEstimate * 1.5),
		      gasPrice: adjustedGasPrice
		    });

		    console.log('17. Transaction successful:', tx.transactionHash);
		    const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
		    console.log('18. Transaction receipt:', receipt);
		    
		    console.log("19. Updating presale info and user balances");
		    await updatePresaleInfo();
		    await updateUserBalances();
		    setBnbAmount('');
		    alert("Purchase successful!");
		  } catch (error) {
		    console.error("20. Detailed error in handleBuyWithBNB:", error);
		    if (error.message.includes("user rejected transaction")) {
		      alert("Transaction was rejected by the user.");
		    } else if (error.message.includes("insufficient funds")) {
		      alert("Insufficient funds for this transaction.");
		    } else if (error.message.includes("gas required exceeds allowance")) {
		      alert("Transaction failed: Gas required exceeds allowance. Please try with a smaller amount or increase your gas limit.");
		    } else {
		      alert(`An error occurred during the purchase: ${error.message}`);
		    }
		  } finally {
		    console.log("21. Setting isPurchasing to false");
		    setIsPurchasing(false);
		  }
		};

	const handleBuyWithUSDT = async () => {
		console.log("1. Starting handleBuyWithUSDT");
		console.log("Input values:", { usdtAmount, account, presaleContractAddress: presaleContract?.options.address });

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
			console.log("6. Converting amounts to Wei");
			const amountWei = web3.utils.toWei(usdtAmount, 'mwei'); // USDT uses 6 decimals
			const minPurchaseWei = web3.utils.toWei(minPurchaseUSDT, 'mwei');
			const maxPurchaseWei = web3.utils.toWei(maxPurchaseUSDT, 'mwei');

			console.log("7. Purchase details:", { amountWei, minPurchaseWei, maxPurchaseWei });

			if (parseFloat(amountWei) < parseFloat(minPurchaseWei)) {
				alert(`Amount is below minimum purchase limit of ${minPurchaseUSDT} USDT`);
				return;
			}

			if (parseFloat(amountWei) > parseFloat(maxPurchaseWei)) {
				alert(`Amount is above maximum purchase limit of ${maxPurchaseUSDT} USDT`);
				return;
			}

			console.log("8. Checking and approving USDT");
			setIsApproving(true);
			try {
				const approveTx = await checkAndApproveUSDT(usdtAmount);
				if (approveTx) {
					console.log('9. USDT Approval transaction:', approveTx.transactionHash);
				}
			} catch (approvalError) {
				console.error("Error approving USDT:", approvalError);
				alert("Failed to approve USDT. Please try again.");
				return;
			} finally {
				setIsApproving(false);
			}

			console.log("10. Estimating gas for USDT purchase");
			setIsPurchasing(true);
			const gasEstimate = await presaleContract.methods.buyTokensWithUSDT(amountWei).estimateGas({ from: account });
			console.log("11. Estimated gas:", gasEstimate);

			console.log("12. Sending USDT purchase transaction");
			const tx = await presaleContract.methods.buyTokensWithUSDT(amountWei).send({ 
				from: account,
				gas: Math.floor(gasEstimate * 1.5)
			});
			console.log('13. Purchase successful:', tx.transactionHash);

			const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
			console.log('14. Transaction receipt:', receipt);

			console.log("15. Updating presale info and user balances");
			await updatePresaleInfo();
			await updateUserBalances();
			setUsdtAmount('');
			alert("Purchase successful!");
		} catch (error) {
			console.error("16. Error buying tokens with USDT:", error);
			if (error.message.includes("user rejected transaction")) {
				alert("Transaction was rejected by the user.");
			} else if (error.message.includes("insufficient funds")) {
				alert("Insufficient funds for this transaction.");
			} else {
				alert(`An error occurred during the purchase: ${error.message}`);
			}
		} finally {
			console.log("17. Setting isPurchasing to false");
			setIsPurchasing(false);
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
			<p>Min Purchase: {minPurchaseBNB} BNB</p>
			<p>Max Purchase: {maxPurchaseBNB} BNB</p>
			<div className="mb-4">
			<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bnbAmount">
			Amount ({bnbBalance} BNB available)
			</label>
			<input
			className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				id="bnbAmount"
					type="number"
						placeholder={`Enter amount (${minPurchaseBNB} - ${maxPurchaseBNB} BNB)`}
			value={bnbAmount}
			onChange={(e) => setBnbAmount(e.target.value)}
			/>
			</div>
			<button
			className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				onClick={handleBuyWithBNB}
			disabled={presaleStatus !== 'Active' || isPurchasing}
			>
			{isPurchasing ? 'Purchasing...' : 'Buy with BNB'}
			</button>
			</div>
			<div className="w-full md:w-1/2 px-2 mb-4">
			<h2 className="text-xl font-bold mb-2">Buy with USDT</h2>
			<p>USDT Rate: 1 USDT = {parseFloat(tokenRate.usdt).toFixed(2)} UWT</p>
			<p>Min Purchase: {minPurchaseUSDT} USDT</p>
			<p>Max Purchase: {maxPurchaseUSDT} USDT</p>
			<div className="mb-4">
			<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="usdtAmount">
			Amount ({usdtBalance} USDT available)
			</label>
			<input
			className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				id="usdtAmount"
					type="number"
						placeholder={`Enter amount (${minPurchaseUSDT} - ${maxPurchaseUSDT} USDT)`}
			value={usdtAmount}
			onChange={(e) => setUsdtAmount(e.target.value)}
			/>
			</div>
			<button
			className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
				onClick={handleBuyWithUSDT}
			disabled={presaleStatus !== 'Active' || isApproving || isPurchasing}
			>
			{isApproving ? 'Approving...' : isPurchasing ? 'Purchasing...' : 'Buy with USDT'}
			</button>
			</div>
			</div>
			</div>

			{isOwner && (
					  <Link 
					    to="/owner-config" 
					    className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
					  >
					    Owner Settings
					  </Link>
					)}
			</div>
	);
}

export default Presale;