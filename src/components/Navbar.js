import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';

function Navbar() {
  const { account, isUnlocked, connectWallet } = useContext(Web3Context);

  const handleConnectClick = () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      connectWallet();
    } else {
      alert('MetaMask is not installed. Please install MetaMask to use this feature.');
    }
  };

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-white text-2xl font-bold">UWealth</Link>
        <div className="space-x-4">
          <Link to="/staking" className="text-white hover:text-blue-200">Staking</Link>
          <Link to="/investment" className="text-white hover:text-blue-200">Investment</Link>
          <Link to="/trading-bot" className="text-white hover:text-blue-200">Trading Bot</Link>
          <Link to="/presale" className="text-white hover:text-blue-200">Presale</Link>
          {!isUnlocked ? (
            <button
              onClick={handleConnectClick}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
            >
              Connect MetaMask
            </button>
          ) : (
            <span className="text-white bg-blue-700 px-4 py-2 rounded-md">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;