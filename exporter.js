const { ApiPromise, WsProvider } = require('@polkadot/api');
const express = require('express');
const fs = require('fs').promises;
const client = require('prom-client');

const app = express();
const PORT = 3000;

const addressGauge = new client.Gauge({
  name: 'balance',
  help: 'Addresses from file',
  labelNames: ['account']
});

const accountBalanceMap = new Map();

const WS_URL = process.env.POLKADOT_WS_URL || 'wss://westend.api.onfinality.io/public-ws';
const wsProvider = new WsProvider(WS_URL);

app.get('/metrics', serveMetrics);

async function serveMetrics(req, res) {
  try {
    updateMetricsFromBalances();
    res.set('Content-Type', client.register.contentType);
    res.end(client.register.metrics());
  } catch (error) {
    console.error('Error in metrics endpoint:', error);
    res.status(500).end();
  }
}

function updateMetricsFromBalances() {
  accountBalanceMap.forEach((balance, addr) => {
    addressGauge.set({ account: addr }, balance);
  });
}

async function fetchBalance(addr) {
  const api = await ApiPromise.create({ provider: wsProvider });
  let { data: { free: previousFree }, nonce: previousNonce } = await api.query.system.account(addr);

  console.log(`${addr} has a balance of ${previousFree}, nonce ${previousNonce}`);
  accountBalanceMap.set(addr, previousFree / 1e12)

  api.query.system.account(addr, ({ data: { free: currentFree }, nonce: currentNonce }) => {
    // Calculate the delta
    const change = currentFree.sub(previousFree);

    if (!change.isZero()) {
      console.log(`${addr}: New balance change of ${change}, nonce ${currentNonce}`);
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
    fetchBalance(addr)
  }
}

app.listen(PORT, () => {
  console.log(`Exporter running on http://0.0.0.0:${PORT}/metrics`);
  worker()
});
