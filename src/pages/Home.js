import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Welcome to UWealth</h1>
      <p className="text-xl mb-8">Empower your financial future with decentralized finance.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/staking" className="bg-blue-500 text-white p-6 rounded-lg shadow-md hover:bg-blue-600 transition duration-300">
          <h2 className="text-2xl font-semibold mb-2">Staking</h2>
          <p>Earn rewards by staking your UWT tokens</p>
        </Link>
        <Link to="/investment" className="bg-green-500 text-white p-6 rounded-lg shadow-md hover:bg-green-600 transition duration-300">
          <h2 className="text-2xl font-semibold mb-2">Investment</h2>
          <p>Invest in our professionally managed funds</p>
        </Link>
        <Link to="/trading-bot" className="bg-purple-500 text-white p-6 rounded-lg shadow-md hover:bg-purple-600 transition duration-300">
          <h2 className="text-2xl font-semibold mb-2">Trading Bot</h2>
          <p>Automate your trading with our AI-powered bots</p>
        </Link>
        <Link to="/governance" className="bg-yellow-500 text-white p-6 rounded-lg shadow-md hover:bg-yellow-600 transition duration-300">
          <h2 className="text-2xl font-semibold mb-2">Governance</h2>
          <p>Participate in platform decisions</p>
        </Link>
      </div>
    </div>
  );
}

export default Home;