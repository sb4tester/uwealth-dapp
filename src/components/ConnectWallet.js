import React, { useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';

function ConnectWallet() {
  const { account, connectWallet } = useContext(Web3Context);

  return (
    <div>
      {account ? (
        <button className="bg-gray-800 text-white px-4 py-2 rounded">
          {account.slice(0, 6)}...{account.slice(-4)}
        </button>
      ) : (
        <button onClick={connectWallet} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Connect Wallet
        </button>
      )}
    </div>
  );
}

export default ConnectWallet;