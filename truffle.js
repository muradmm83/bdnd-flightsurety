var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
      gas: 300000000,
      gasPrice: 20000000000
    },

    developmentOld: {
      provider: function () {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      },
      network_id: '*',
      gas: 4600000,
      gasPrice: 100000000000
    }
  },
  compilers: {
    solc: {
      //version: "^0.4.24"
      version: "^0.4.24"
    }
  }
};