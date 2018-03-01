# PolicyPal Network Crowdsale
Overview of PolicyPal Network Crowdsale Contract

The smart contracts have been audited by [ChainSecurity]. The audit reports can be found in the folder named `audit`

## Sale Overview
Only whitelisted addresses can participate in PolicyPal Network crowdsale.

During the first 24 hours, everyone is guaranteed the individual min cap of 0.1 ETH and max cap of 1 ETH.

After the guaranteed allocation period, the individual cap will be increased to 10 ETH i.e. for someone who has purchased 1 ETH in the first 24 hours, he or she may now purchase an additional 9 ETH on a first-come-first-served basis. Again, only whitelisted addresses can participate.

## Tech
The contracts uses a variety of open source projects for ease of development.
#### Smart Contracts
* [OpenZeppelin] - Framework to build secure smart contracts on Ethereum
* [Truffle] - Development environment & testing framework
* [Parity] - Ethereum Client

#### JS
* [Chai] - Assertion library for JS testing
* [Babel] - ES2015 support for JS

#### Use of OpenZeppelin code
* `SafeMath` Math operations with safety checks that throw on error.
* `Ownable` The Ownable contract has an owner address, and provides basic authorization control functions which simplifies the implementation of "user permissions".
* `Burnable` Token that can be irreversibly burned (destroyed).
* `StandardToken` Implementation of the basic standard ERC20 token.

## Installation
#### Libraries
`````````````````
$ npm install -g ethereumjs-testrpc
$ npm install -g truffle
`````````````````
#### Dependencies
`````````````````
$ npm i
`````````````````

## Development
#### RPC
To launch local testnet, open terminal & run.
`````````````````
$ testrpc
`````````````````
#### Truffle
Open another new terminal to compile and migrate code changes
`````````````````
$ truffle migrate --reset (--network ropsten)
`````````````````

## Testing
We're using [Ropsten] & [MetaMask] tests on TestNet for beta tests. Local development tests are done using [Truffle]'s test framework.

#### Local Testing
`````````````````
$ npm test
`````````````````
Commands runs bash script @ `/scripts/test.sh`, and devs can choose the test to carry out.
* All tests - Hit enter
* Crowdsale Contract - `crowdsale` or `cs`
* Token Contract - `token` or `tc`

#### Beta Testing on TestNet
[Ethereum Faucet]  is used to get free ethereum used for deployment, purchases and etc.

(1) Open terminal, to update & sync chain.
`````````````````
$ parity --geth --force-ui --chain ropsten
`````````````````
(2) Open browser and key in address `http://127.0.0.1:8180/` to launch parity interface.
> Note: You will be prompted to create an account (if you've not).

(3) Open new terminal, cd to project dir and migrate contracts onto Ropsten testnet.
> Parity requires your password at certain steps of the migration.
`````````````````
$ truffle migrate --reset --network ropsten
`````````````````

## Post Deployment
#### Uploading Contract Code & ABI
(1) Get compiler version from terminal
`````````````````
$ solcjs --version
`````````````````

(2) Flatten crowdsale source using [Truffle Flattener]
`````````````````
$ truffle-flattener contracts/PolicyPalNetworkCrowdsale.sol > PolicyPalNetworkCrowdsaleCompiled.sol
`````````````````

(3) Copy contents to contract source in etherscan
(4) Get Contract ABI from [Ethereum Contract ABI Converter]

[ChainSecurity]: <https://chainsecurity.com>
[OpenZeppelin]: <https://github.com/OpenZeppelin/zeppelin-solidity>
[Truffle]: <https://github.com/trufflesuite/truffle>
[Chai]: <http://chaijs.com/>
[Babel]: <https://babeljs.io/>
[Parity]: <https://github.com/paritytech/parity>
[Ropsten]: <https://ropsten.etherscan.io/>
[MetaMask]: <https://metamask.io/>
[Mocha]: <https://mochajs.org/>
[Ethereum Faucet]: <http://faucet.ropsten.be:3001/>
[Truffle Flattener]: <https://github.com/alcuadrado/truffle-flattener>
[Ethereum Contract ABI Converter]: <https://abi.sonnguyen.ws/>
