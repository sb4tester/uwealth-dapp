import React, { createContext, useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);

  const connectWallet = async () => {
    console.log("Attempting to connect wallet...");
    if (typeof window.ethereum !== 'undefined') {
      try {
        console.log("Ethereum object found, requesting accounts...");
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const browserProvider = new BrowserProvider(window.ethereum);
        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();

        console.log("Connected to address:", address);

        setProvider(browserProvider);
        setSigner(signer);
        setAccount(address);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert("Failed to connect wallet. Please check the console for more details.");
      }
    } else {
      console.log('Ethereum object not found. Please install MetaMask!');
      alert('Please install MetaMask or another Ethereum wallet extension!');
    }
  };

  useEffect(() => {
    const initProvider = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        window.ethereum.on('accountsChanged', async (accounts) => {
          if (accounts.length > 0) {
            const signer = await browserProvider.getSigner();
            setSigner(signer);
            setAccount(accounts[0]);
          } else {
            setSigner(null);
            setAccount(null);
          }
        });
      }
    };

    initProvider();
  }, []);

  return (
    <Web3Context.Provider value={{ provider, signer, account, connectWallet }}>
      {children}
    </Web3Context.Provider>
  );
};