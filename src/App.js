import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f0f0f0;
  padding: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  padding: 10px;
  margin: 10px 0;
  width: 200px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const CounterValue = styled.div`
  font-size: 24px;
  margin: 20px 0;
`;

const ErrorMessage = styled.div`
  color: red;
  margin: 10px 0;
`;

const LoadingIndicator = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 10px 0;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TransactionHistory = styled.div`
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
`;

const TransactionItem = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
`;

function App() {
  const [counter, setCounter] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [contract, setContract] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const initWallet = async () => {
      if (window.razor) {
        try {
          const razorWallet = await window.razor.connect();
          setWallet(razorWallet);
        } catch (error) {
          console.error("Failed to connect to Razor wallet:", error);
          setError("Failed to connect to wallet. Please make sure you have Razor wallet installed and try again.");
        }
      } else {
        console.log("Razor wallet is not available");
        setError("Razor wallet is not available. Please install it to use this dApp.");
      }
    };

    initWallet();
  }, []);

  useEffect(() => {
    const initContract = async () => {
      if (wallet) {
        try {
          const provider = new ethers.BrowserProvider(wallet);
          const signer = await provider.getSigner();
          const contractAddress = '0xC6F4d2C263f36dacCF73F6bF112b62249C015895';
          const contractABI = [
            "function number() public view returns (uint256)",
            "function setNumber(uint256 newNumber) public",
            "function increment() public"
          ];
          const counterContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(counterContract);
          const currentNumber = await counterContract.number();
          setCounter(currentNumber.toNumber());
        } catch (error) {
          console.error("Failed to initialize contract:", error);
          setError("Failed to initialize contract. Please check your connection and try again.");
        }
      }
    };

    initContract();
  }, [wallet]);

  const handleIncrement = async () => {
    if (contract) {
      try {
        setLoading(true);
        setError('');
        const tx = await contract.increment();
        await tx.wait();
        const newNumber = await contract.number();
        setCounter(newNumber.toNumber());
        setTransactions([{ type: 'Increment', hash: tx.hash }, ...transactions]);
      } catch (error) {
        console.error("Failed to increment:", error);
        setError("Failed to increment. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetNumber = async () => {
    if (contract && inputValue) {
      try {
        setLoading(true);
        setError('');
        const tx = await contract.setNumber(inputValue);
        await tx.wait();
        const newNumber = await contract.number();
        setCounter(newNumber.toNumber());
        setInputValue('');
        setTransactions([{ type: 'Set Number', hash: tx.hash, value: inputValue }, ...transactions]);
      } catch (error) {
        console.error("Failed to set number:", error);
        setError("Failed to set number. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container>
      <Title>Pump Fun</Title>
      <CounterValue>Current Number: {counter}</CounterValue>
      <Button onClick={handleIncrement} disabled={loading}>
        {loading ? 'Processing...' : 'Increment'}
      </Button>
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter number"
        disabled={loading}
      />
      <Button onClick={handleSetNumber} disabled={loading || !inputValue}>
        {loading ? 'Processing...' : 'Set Number'}
      </Button>
      {loading && <LoadingIndicator />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <TransactionHistory>
        <h3>Transaction History</h3>
        {transactions.map((tx, index) => (
          <TransactionItem key={index}>
            <div>Type: {tx.type}</div>
            <div>Hash: {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</div>
            {tx.value && <div>Value: {tx.value}</div>}
          </TransactionItem>
        ))}
      </TransactionHistory>
    </Container>
  );
}

export default App;
