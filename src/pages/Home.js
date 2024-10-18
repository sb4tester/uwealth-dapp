import React from 'react';
import { Link } from 'react-router-dom';
import Presale from './Presale'; // Import Presale component
import Roadmap from '../components/Roadmap';
import Tokenomics from '../components/Tokenomics';

function Home() {
	return (
		    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] text-white">
		      <div className="container mx-auto px-4 py-8">
		        <main>
		          <section className="flex flex-col md:flex-row justify-between items-center mb-20">
		            <div className="w-full md:w-1/2 mb-8 md:mb-0">
		              <h1 className="text-4xl md:text-5xl font-bold mb-4">Something Better Than Meme Coin</h1>
		              <p className="text-lg md:text-xl text-gray-400 mb-8">Is simply dummy text of the printing and typesetting industry.</p>
		              <div className="space-y-4 md:space-y-0 md:space-x-4">
		                <Link to="/dapp" className="block md:inline-block bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 text-center">Open dApp</Link>
		                <Link to="/whitepaper" className="block md:inline-block border border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-black text-center mt-4 md:mt-0">Whitepaper</Link>
		              </div>
		            </div>
		            <div className="w-full md:w-1/3">
		              <Presale /> {/* Add Presale component here */}
		            </div>
		          </section>

		          <section className="mb-20">
		            <h2 className="text-3xl font-bold mb-8 text-center">How to buy</h2>
		            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
		              <div className="bg-[#1e2a3a] p-6 rounded-lg">
		                <h3 className="text-xl font-bold mb-4">1. Connect Wallet</h3>
		                <p className="text-gray-400">Connect with your preferable crypto wallet, we offer different options</p>
		              </div>
		              <div className="bg-[#1e2a3a] p-6 rounded-lg">
		                <h3 className="text-xl font-bold mb-4">2. Choose token & chain</h3>
		                <p className="text-gray-400">Select the token you want to use for purchase. Chain by typing likes BNB, ETH, USDT, USDC and more</p>
		              </div>
		              <div className="bg-[#1e2a3a] p-6 rounded-lg">
		                <h3 className="text-xl font-bold mb-4">3. Receive tokens</h3>
		                <p className="text-gray-400">Purchased tokens are distributed in the smart contract after the collection ends. Tokens will be deposited</p>
		              </div>
		            </div>
		          </section>

		          <Roadmap />

		          <Tokenomics />
		        </main>
		      </div>
		    </div>
		  );
		}

export default Home;