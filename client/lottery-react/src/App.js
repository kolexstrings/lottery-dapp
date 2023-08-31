import "./App.css";
import React, { useEffect, useState } from "react";
// import web3 from './web3';
import lottery from "./lottery";
import web3 from "./web3";


const App = () => {
  const [manager, setManager] = useState('');
  const [players, setPlayers] = useState([]);
  const [balance, setBalance] = useState('');
  const [entryValue, setEntryValue] = useState(0);
  const [message, setMessage] = useState(null);

  useEffect(()=> {
    async function fetchData () {
      try {
        const managerResult = await lottery.methods.manager().call();
        setManager(managerResult);
      }catch(error){
        console.error("There was an error getting the manager: ",error);
      }

      try {
        const playersResult = await lottery.methods.getPlayers().call();
        setPlayers(playersResult);
      }catch(error) {
        console.error("There was an issue with fetching the array of players: ", error);
      }

      try {
        const balanceResult = await web3.eth.getBalance(lottery.options.address); 
        setBalance(balanceResult);
      }catch(error) {
        console.error("There was an issue fetching lottery contract balance: ", error);
      }
    }

    fetchData();

  }, []);

  async function handleSubmit (event) {

    event.preventDefault();

    const accounts = await web3.eth.getAccounts();
    
    setMessage("Waiting on transaction success....")
   try {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei(entryValue, 'ether')
    });
   }catch(error) {
    console.error("There was an error calling the enter funtion: ", error);
   }

    setMessage("You have successfully entered the lottery !")
  };

  async function handleClick () {
    const accounts = await web3.eth.getAccounts();

    setMessage(" Waiting on transaction success....");

    try {
      await lottery.methods.pickWinner().send({
        from: accounts[0],
      })
    } catch (error){
      console.error("There was an issue calling the pickWinner function: ", error);
    }

    setMessage("A winner has been randomly selected successfully");
  }

  return (
    <div>
      <h2>Lottery Contract</h2>
      <p>This contract is managed by {manager}</p>
      <p>There are currently {players.length} people entered, into this lottery, 
      competing to win {" "}{web3.utils.fromWei(balance, 'ether')} ether!
      </p>

      <hr />

      <form onSubmit={handleSubmit}>
        <h4>Want to try your luck ?</h4>
        <div>
          <label>Amount of ether</label>
          <input
          value={entryValue}
          onChange={(event)=> setEntryValue(event.target.value)}
          />
        </div>
        <button type="submit">Enter</button>
      </form>

      <hr />
        <h4>Ready to pick a winner?</h4>
        <button
        onClick={handleClick}>Pick Winner</button>
      <hr />
      <h1>{message}</h1>
    </div>
  )
}

export default App;
