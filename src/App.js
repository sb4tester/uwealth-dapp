import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Web3Provider } from './contexts/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Staking from './pages/Staking';
import Investment from './pages/Investment';
import TradingBot from './pages/TradingBot';
import Presale from './pages/Presale';
import Footer from './components/Footer';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/investment" element={<Investment />} />
            <Route path="/trading-bot" element={<TradingBot />} />
            <Route path="/presale" element={<Presale />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;