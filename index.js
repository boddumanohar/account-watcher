// Import the API
const { ApiPromise, WsProvider } = require('@polkadot/api');

const fs = require('fs').promises;

async function readAddresses() {
    const data = await fs.readFile('addresses.txt', 'utf8');
    return data.split('\n').filter(address => address.trim() !== "");
}

async function getBalance(account) {

    // todo: change this to kusama network at the end
    const wsProvider = new WsProvider('wss://westend.api.onfinality.io/public-ws');
    const api = await ApiPromise.create({ provider: wsProvider });
    // Retrieve the initial balance. Since the call has no callback, it is simply a promise
    // that resolves to the current on-chain value
    let { data: { free: previousFree }, nonce: previousNonce } = await api.query.system.account(account);

    console.log(`${account} has a balance of ${previousFree}`);
}

readAddresses()
    .then(addresses => {
        for (let address of addresses) {
            getBalance(address)
        }
    })
    .catch(err => {
        console.error('Error reading the file:', err);
});

