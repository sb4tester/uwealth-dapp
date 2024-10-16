import React, { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';
import presaleABI from '../contracts/UWealthPresale.json';
import { ERC20ABI } from '../contracts/ERC20ABI';  // เพิ่มบรรทัดนี้
import config from '../config/config';

function OwnerConfig() {
  console.log("1. OwnerConfig component rendered");

  const { web3, account, checkNetwork } = useContext(Web3Context);
  console.log("2. Web3Context values:", { web3: !!web3, account, checkNetwork: !!checkNetwork });

  const [canWithdrawTokens, setCanWithdrawTokens] = useState(false);
  const [presaleContract, setPresaleContract] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentValues, setCurrentValues] = useState({
    endTime: '',
    minPurchaseBNB: '',
    maxPurchaseBNB: '',
    minPurchaseUSDT: '',
    maxPurchaseUSDT: '',
    tokensPerUSDT: '',
    tokensPerBNB: ''
  });
  const [newValues, setNewValues] = useState({
    endTime: '',
    minPurchaseBNB: '',
    maxPurchaseBNB: '',
    minPurchaseUSDT: '',
    maxPurchaseUSDT: '',
    tokensPerUSDT: '',
    tokensPerBNB: ''
  });

  useEffect(() => {
    console.log("3. useEffect triggered");
    async function initializeContract() {
    	  console.log("4. Initializing contract");
    	  if (web3) {
    	    console.log("5. Web3 instance available");
    	    try {
    	      const networkId = await web3.eth.net.getId();
    	      console.log("Network ID:", networkId);
    	      
    	      const deployedNetwork = presaleABI.networks[networkId];
    	      if (!deployedNetwork) {
    	        throw new Error("Contract not deployed on the current network");
    	      }
    	      
    	      const contractAddress = deployedNetwork.address;
    	      console.log("6. Presale contract address:", contractAddress);
    	      
    	      const contract = new web3.eth.Contract(presaleABI.abi, contractAddress);
    	      console.log("7. Contract instance created");
    	      setPresaleContract(contract);
    	      await checkOwnership(contract);
    	      await fetchCurrentValues(contract);
    	    } catch (error) {
    	      console.error("Error initializing contract:", error);
    	    }
    	  } else {
    	    console.log("5. Web3 instance not available");
    	  }
    	}
    initializeContract();
  }, [web3, account]);
  
  useEffect(() => {
	  if (presaleContract && web3) {
	    checkWithdrawConditions();
	  }
	}, [presaleContract, web3]);

  const checkWithdrawConditions = async () => {
	  if (presaleContract && web3) {
	    try {
	      const currentTime = Math.floor(Date.now() / 1000);
	      const endTime = await presaleContract.methods.endTime().call();
	      const uwtTokenAddress = await presaleContract.methods.uwtToken().call();
	      const uwtTokenContract = new web3.eth.Contract(ERC20ABI, uwtTokenAddress);
	      const remainingTokens = await uwtTokenContract.methods.balanceOf(presaleContract.options.address).call();

	      setCanWithdrawTokens(currentTime > Number(endTime) && Number(remainingTokens) > 0);
	    } catch (error) {
	      console.error("Error checking withdraw conditions:", error);
	      setCanWithdrawTokens(false);
	    }
	  }
	};


  const checkOwnership = async (contract) => {
    console.log("8. Checking ownership");
    if (contract && account) {
      try {
        const owner = await contract.methods.owner().call();
        console.log("9. Contract owner:", owner);
        console.log("10. Current account:", account);
        setIsOwner(owner.toLowerCase() === account.toLowerCase());
      } catch (error) {
        console.error("Error checking ownership:", error);
      }
    }
  };

  const fetchCurrentValues = async (contract) => {
	  console.log("11. Fetching current values");
	  setIsLoading(true);
	  try {
	    let currentEndTime, currentMinPurchaseBNB, currentMaxPurchaseBNB, 
	        currentMinPurchaseUSDT, currentMaxPurchaseUSDT, 
	        currentTokensPerUSDT, currentTokensPerBNB;

	    try {
	      currentEndTime = await contract.methods.endTime().call();
	      console.log("End time:", currentEndTime.toString());
	    } catch (error) {
	      console.error("Error fetching endTime:", error);
	    }

	    try {
	      currentMinPurchaseBNB = await contract.methods.minPurchaseBNB().call();
	      console.log("Min Purchase BNB:", currentMinPurchaseBNB.toString());
	    } catch (error) {
	      console.error("Error fetching minPurchaseBNB:", error);
	    }

	    try {
	      currentMaxPurchaseBNB = await contract.methods.maxPurchaseBNB().call();
	      console.log("Max Purchase BNB:", currentMaxPurchaseBNB.toString());
	    } catch (error) {
	      console.error("Error fetching maxPurchaseBNB:", error);
	    }

	    try {
	      currentMinPurchaseUSDT = await contract.methods.minPurchaseUSDT().call();
	      console.log("Min Purchase USDT:", currentMinPurchaseUSDT.toString());
	    } catch (error) {
	      console.error("Error fetching minPurchaseUSDT:", error);
	    }

	    try {
	      currentMaxPurchaseUSDT = await contract.methods.maxPurchaseUSDT().call();
	      console.log("Max Purchase USDT:", currentMaxPurchaseUSDT.toString());
	    } catch (error) {
	      console.error("Error fetching maxPurchaseUSDT:", error);
	    }

	    try {
	      currentTokensPerUSDT = await contract.methods.tokensPerUSDT().call();
	      console.log("Tokens per USDT:", currentTokensPerUSDT.toString());
	    } catch (error) {
	      console.error("Error fetching tokensPerUSDT:", error);
	    }

	    try {
	      currentTokensPerBNB = await contract.methods.tokensPerBNB().call();
	      console.log("Tokens per BNB:", currentTokensPerBNB.toString());
	    } catch (error) {
	      console.error("Error fetching tokensPerBNB:", error);
	    }

	    const values = {
	      endTime: currentEndTime ? new Date(Number(currentEndTime) * 1000).toISOString().slice(0, 16) : '',
	      minPurchaseBNB: currentMinPurchaseBNB ? web3.utils.fromWei(currentMinPurchaseBNB.toString(), 'ether') : '',
	      maxPurchaseBNB: currentMaxPurchaseBNB ? web3.utils.fromWei(currentMaxPurchaseBNB.toString(), 'ether') : '',
	      minPurchaseUSDT: currentMinPurchaseUSDT ? web3.utils.fromWei(currentMinPurchaseUSDT.toString(), 'mwei') : '',
	      maxPurchaseUSDT: currentMaxPurchaseUSDT ? web3.utils.fromWei(currentMaxPurchaseUSDT.toString(), 'mwei') : '',
	      tokensPerUSDT: currentTokensPerUSDT ? web3.utils.fromWei(currentTokensPerUSDT.toString(), 'ether') : '',
	      tokensPerBNB: currentTokensPerBNB ? web3.utils.fromWei(currentTokensPerBNB.toString(), 'ether') : ''
	    };

	    console.log("13. Processed values:", values);
	    setCurrentValues(values);
	    setNewValues(values);
	  } catch (error) {
	    console.error("Error in fetchCurrentValues:", error);
	  } finally {
	    setIsLoading(false);
	  }
	};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewValues(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePresale = async () => {
	  if (!presaleContract || !isOwner) return;
	  try {
	    console.log("Updating presale with values:", newValues);
	    const startTimeUnix = Math.floor(Date.now() / 1000) + 60; // เริ่มใน 1 นาที
	    const endTimeUnix = Math.floor(new Date(newValues.endTime).getTime() / 1000);
	    const tx = await presaleContract.methods.startPresale(
	      startTimeUnix,
	      endTimeUnix,
	      web3.utils.toWei(newValues.tokensPerBNB, 'ether'),
	      web3.utils.toWei(newValues.tokensPerUSDT, 'ether'),
	      web3.utils.toWei(newValues.minPurchaseBNB, 'ether'),
	      web3.utils.toWei(newValues.maxPurchaseBNB, 'ether'),
	      web3.utils.toWei(newValues.minPurchaseUSDT, 'mwei'),
	      web3.utils.toWei(newValues.maxPurchaseUSDT, 'mwei')
	    ).send({ from: account });
	    
	    console.log('Presale settings updated:', tx.transactionHash);
	    alert('Presale settings have been updated successfully!');
	    fetchCurrentValues(presaleContract);
	  } catch (error) {
	    console.error("Error updating presale settings:", error);
	    alert("Failed to update presale settings. Check console for details.");
	  }
	};

  const handleWithdrawTokens = async () => {
    if (!presaleContract || !isOwner) return;
    try {
      const tx = await presaleContract.methods.withdrawRemainingTokens().send({ from: account });
      console.log('Tokens withdrawn:', tx.transactionHash);
      alert('Remaining tokens have been withdrawn successfully!');
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      alert("Failed to withdraw tokens. Check console for details.");
    }
  };

  const handleWithdrawBNB = async () => {
    if (!presaleContract || !isOwner) return;
    try {
      const tx = await presaleContract.methods.withdrawBNB().send({ from: account });
      console.log('BNB withdrawn:', tx.transactionHash);
      alert('BNB has been withdrawn successfully!');
    } catch (error) {
      console.error("Error withdrawing BNB:", error);
      alert("Failed to withdraw BNB. Check console for details.");
    }
  };

  const handleWithdrawUSDT = async () => {
    if (!presaleContract || !isOwner) return;
    try {
      const tx = await presaleContract.methods.withdrawUSDT().send({ from: account });
      console.log('USDT withdrawn:', tx.transactionHash);
      alert('USDT has been withdrawn successfully!');
    } catch (error) {
      console.error("Error withdrawing USDT:", error);
      alert("Failed to withdraw USDT. Check console for details.");
    }
  };

  console.log("14. Rendering component");
  if (!isOwner) {
    console.log("15. User is not owner");
    return <div>You are not authorized to access this page.</div>;
  }

  if (isLoading) {
    console.log("16. Still loading");
    return <div>Loading current values...</div>;
  }

  console.log("17. Rendering full component");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Owner Configuration</h1>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Update Presale Settings</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            End Time (Current: {new Date(currentValues.endTime).toLocaleString()})
            <input
              type="datetime-local"
              name="endTime"
              value={newValues.endTime}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Min Purchase BNB (Current: {currentValues.minPurchaseBNB} BNB)
            <input
              type="number"
              name="minPurchaseBNB"
              value={newValues.minPurchaseBNB}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Max Purchase BNB (Current: {currentValues.maxPurchaseBNB} BNB)
            <input
              type="number"
              name="maxPurchaseBNB"
              value={newValues.maxPurchaseBNB}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Min Purchase USDT (Current: {currentValues.minPurchaseUSDT} USDT)
            <input
              type="number"
              name="minPurchaseUSDT"
              value={newValues.minPurchaseUSDT}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Max Purchase USDT (Current: {currentValues.maxPurchaseUSDT} USDT)
            <input
              type="number"
              name="maxPurchaseUSDT"
              value={newValues.maxPurchaseUSDT}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tokens per USDT (Current: {currentValues.tokensPerUSDT})
            <input
              type="number"
              name="tokensPerUSDT"
              value={newValues.tokensPerUSDT}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tokens per BNB (Current: {currentValues.tokensPerBNB})
            <input
              type="number"
              name="tokensPerBNB"
              value={newValues.tokensPerBNB}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </label>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleUpdatePresale}
        >
          Update Presale Settings
        </button>
      </div>
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
        <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
        onClick={handleWithdrawTokens}
        disabled={!canWithdrawTokens}
      >
        Withdraw Remaining Tokens
      </button>
        <button
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
          onClick={handleWithdrawBNB}
        >
          Withdraw BNB
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleWithdrawUSDT}
        >
          Withdraw USDT
        </button>
      </div>
    </div>
  );
}

export default OwnerConfig;