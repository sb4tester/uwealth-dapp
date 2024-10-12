import React, { createContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import config from '../config/config';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const getMetaMaskProvider = () => {
    if (typeof window.ethereum !== 'undefined') {
      // Check if MetaMask is the only provider
      if (window.ethereum.isMetaMask && !window.ethereum.providers) {
        return window.ethereum;
      }
      // If there are multiple providers, find MetaMask
      if (window.ethereum.providers) {
        return window.ethereum.providers.find(provider => provider.isMetaMask);
      }
    }
    return null;
  };
  
  const checkNetwork = async () => {
	    if (web3) {
	      try {
	        const networkId = await web3.eth.net.getId();
	        if (networkId !== config.networkId) {
	          alert(`Please connect to ${config.networkName} (Network ID: ${config.networkId})`);
	          return false;
	        }
	        return true;
	      } catch (error) {
	        console.error("Error checking network:", error);
	        return false;
	      }
	    }
	    return false;
	  };

  const checkWalletStatus = async () => {
    const provider = getMetaMaskProvider();
    if (provider) {
      const web3Instance = new Web3(provider);
      setWeb3(web3Instance);
      
      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsUnlocked(true);
        } else {
          setAccount(null);
          setIsUnlocked(false);
        }
      } catch (error) {
        console.error("An error occurred while checking wallet status:", error);
        setAccount(null);
        setIsUnlocked(false);
      }
    } else {
      setAccount(null);
      setIsUnlocked(false);
    }
  };

  const connectWallet = async () => {
    const provider = getMetaMaskProvider();
    if (provider) {
      try {
        await provider.request({ method: 'eth_requestAccounts' });
        await checkWalletStatus();
      } catch (error) {
        console.error("Failed to connect to MetaMask:", error);
        setAccount(null);
        setIsUnlocked(false);
      }
    } else {
      console.log('MetaMask not found');
      alert('MetaMask is not installed. Please install MetaMask to use this feature.');
    }
  };

  useEffect(() => {
    checkWalletStatus();
    const provider = getMetaMaskProvider();
    if (provider) {
      provider.on('accountsChanged', checkWalletStatus);
      provider.on('chainChanged', checkWalletStatus);
    }
    return () => {
      if (provider) {
        provider.removeListener('accountsChanged', checkWalletStatus);
        provider.removeListener('chainChanged', checkWalletStatus);
      }
    };
  }, []);

  return (
    <Web3Context.Provider value={{ web3, account, isUnlocked, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};