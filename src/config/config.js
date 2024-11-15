// src/config/config.js

const config = {
  development: {
    networkId: 97, // Binance Smart Chain Testnet
    networkName: "Binance Smart Chain Testnet",
    contracts: {
      uwealthToken: {
        address: "0x1b49d75bf32f2e2274aad0cec293100e33cae787",
      },
      presale: {
        address: "0xb824d37cc5150445e7ffeba1762b3c9e65f1535c",
      },
      blueChipCryptoFund: {
        address: "0x9a7fafe7e7d317f315393cab2f6fd10f4db5484b",
      },
      tradingBot: {
        address: "0x3ae2e93b05f0e3a4098a57a47ac8ac17cc35ba97",
      },
      uwealthStaking: {
        address: "0x2ee34342e37a27fb753858a01239f0315a899801",
      },
      uwealthVesting: {
        address: "0xf1f39ee079201ad31fa64e9ee0649ef58c35fcaa",
      },
      mockUSDT: {
        address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd", // Mock USDT address on BSC Testnet
      },
    },
    gasMultiplier: 1.5,
    updateInterval: 300000, // 5 minutes in milliseconds
  },
  production: {
    // Add production configuration here when ready
  },
};

const env = process.env.REACT_APP_ENV || 'development';

export default config[env];