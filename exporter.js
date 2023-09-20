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

const accountBalanceMap = new Map();

async function getBalance(account) {
    // todo: change this to kusama network at the end
    const wsProvider = new WsProvider('wss://westend.api.onfinality.io/public-ws');
    const api = await ApiPromise.create({ provider: wsProvider });
    const { nonce, data: balance } = await api.query.system.account(account);
    const balanceInDot = balance.free / 1e12;
    return balanceInDot;
}

app.get('/metrics', async (req, res) => {
    try {

      accountBalanceMap.forEach((balance, addr) => {
        console.log(addr, balance)
        addressGauge.set({ account: addr }, balance);
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

  async function fetchBalance(addr) {
    const wsProvider = new WsProvider('wss://westend.api.onfinality.io/public-ws');
    const api = await ApiPromise.create({ provider: wsProvider });

    let { data: { free: previousFree }, nonce: previousNonce } = await api.query.system.account(addr);

    console.log(`${addr} has a balance of ${previousFree}, nonce ${previousNonce}`);
    console.log(`You may leave this example running and start example 06 or transfer any value to ${addr}`);
    accountBalanceMap.set(addr, previousFree / 1e12)

    // Here we subscribe to any balance changes and update the on-screen value
    api.query.system.account(addr, ({ data: { free: currentFree }, nonce: currentNonce }) => {
      // Calculate the delta
      const change = currentFree.sub(previousFree);

      if (!change.isZero()) {
        console.log(`New balance change of ${change}, nonce ${currentNonce}`);

        previousFree = currentFree;
        previousNonce = currentNonce;
        accountBalanceMap.set(addr, previousFree / 1e12)
      }
    });
  }

  async function worker() {
    const data = await fs.readFile('addresses.txt', 'utf8');
    const addresses = data.split('\n').filter(addr => addr.trim() !== "");

    for (let addr of addresses) {
      console.log(addr);
      fetchBalance(addr)
  }

}

app.listen(PORT, () => {
  console.log(`Exporter running on http://0.0.0.0:${PORT}/metrics`);
  worker()
});
