import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')), null);
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

let oracles = [];

// register oracles
(async () => {
  try {
    oracles = (await web3.eth.getAccounts()).slice(20, 41); // 20 oracles 

    for (let i = 0; i < oracles.length; i++) {
      await flightSuretyApp.methods.registerOracle().send({
        from: oracles[i],
        value: web3.utils.toWei('1', 'ether')
      });
    }
  } catch (e) {
    console.error(e);
  }
})();

const getRandomStatusCode = () => {
  let status = [10, 20, 30, 40, 50];
  return status[Math.floor(Math.random() * status.length)];
}

flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error);

  let args = event.args;

  for (let i = 0; i < oracles.length; i++) {
    flightSuretyApp.submitOracleResponse(args.index, args.airline, args.flight, args.timestamp, getRandomStatusCode(), {
      from: oracles[i]
    });
  }

});

const app = express();
app.get('/api/oracles', async (req, res) => {
  res.status(200).json({
    response: 'Howdy there 😊'
  });
})

export default app;