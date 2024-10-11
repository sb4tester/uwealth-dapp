export const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  export const formatBalance = (balance, decimals = 18) => {
    return (parseFloat(balance) / 10**decimals).toFixed(4);
  };
  
  export const toWei = (amount, decimals = 18) => {
    return (parseFloat(amount) * 10**decimals).toString();
  };
  
  export const fromWei = (amount, decimals = 18) => {
    return (parseFloat(amount) / 10**decimals).toString();
  };
  
  export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  export const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };
  
  export const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };
  
  export const calculatePercentage = (part, total) => {
    return ((part / total) * 100).toFixed(2);
  };