require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*",
    },
    ropsten: {
      host: "localhost",
      port: 8545,
      network_id: "3",
      from: "0x00",
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
};
