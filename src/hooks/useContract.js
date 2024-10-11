import { useState, useEffect, useContext } from 'react';
import { Web3Context } from '../contexts/Web3Context';

const useContract = (ABI, address) => {
  const { web3 } = useContext(Web3Context);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    if (web3 && ABI && address) {
      const contractInstance = new web3.eth.Contract(ABI, address);
      setContract(contractInstance);
    }
  }, [web3, ABI, address]);

  return contract;
};

export default useContract;