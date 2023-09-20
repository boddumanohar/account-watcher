const { ApiPromise, WsProvider } = require('@polkadot/api');
const express = require('express');
const fs = require('fs').promises;
const client = require('prom-client');

const app = express();
const PORT = 3000; // The port where the exporter will run

// Create a new Gauge metric
const addressGauge = new client.Gauge({
  name: 'balance',
  help: 'Addresses from file',
  labelNames: ['account']
});

async function getBalance(account) {
    // todo: change this to kusama network at the end
    // const wsProvider = new WsProvider('wss://westend.api.onfinality.io/public-ws');
    // const api = await ApiPromise.create({ provider: wsProvider });
    // const { nonce, data: balance } = await api.query.system.account(account);
    // const balanceInDot = balance.free / 1e12;
    // return balanceInDot;
    return 0;
}

app.get('/metrics', async (req, res) => {
    try {
      const data = await fs.readFile('addresses.txt', 'utf8');
      const addresses = data.split('\n').filter(addr => addr.trim() !== "");

      // Use Promise.all() and map() to await all the balance fetching operations
      const balances = await Promise.all(addresses.map(addr => getBalance(addr)));

      addresses.forEach((addr, index) => {
        console.log(balances[index])
        addressGauge.set({ account: addr }, balances[index]);
      });

      console.log(client.register.contentType);
      console.log((await client.register.metrics()).toString)
      res.set('Content-Type', client.register.contentType);
      res.end(client.register.metrics());
    } catch (error) {
      console.error('Error reading the file:', error);
      res.status(500).end();
    }
  });


app.listen(PORT, () => {
  console.log(`Exporter running on http://0.0.0.0:${PORT}/metrics`);
});
