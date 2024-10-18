import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Web3Context } from '../contexts/Web3Context';

function Navbar() {
  const { account, isUnlocked, connectWallet } = useContext(Web3Context);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleConnectClick = () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      connectWallet();
    } else {
      alert('MetaMask is not installed. Please install MetaMask to use this feature.');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gray-900 p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-green-500 text-2xl font-bold">UWealth</Link>
          
          {/* Hamburger menu for mobile */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/staking" className="text-white hover:text-green-500">Staking</Link>
            <Link to="/investment" className="text-white hover:text-green-500">Investment</Link>
            <Link to="/trading-bot" className="text-white hover:text-green-500">Trading Bot</Link>
            <Link to="/presale" className="text-white hover:text-green-500">Presale</Link>
            {!isUnlocked ? (
              <button
                onClick={handleConnectClick}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Connect MetaMask
              </button>
            ) : (
              <span className="text-white bg-gray-800 px-4 py-2 rounded-md">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4">
            <Link to="/staking" className="block text-white hover:text-green-500 py-2">Staking</Link>
            <Link to="/investment" className="block text-white hover:text-green-500 py-2">Investment</Link>
            <Link to="/trading-bot" className="block text-white hover:text-green-500 py-2">Trading Bot</Link>
            <Link to="/presale" className="block text-white hover:text-green-500 py-2">Presale</Link>
            {!isUnlocked ? (
              <button
                onClick={handleConnectClick}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 mt-4"
              >
                Connect MetaMask
              </button>
            ) : (
              <span className="block text-white bg-gray-800 px-4 py-2 rounded-md mt-4">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;