## Web Interface for BULOT

This is a simple web interface to interact with the lottery contract.

### How to Deploy Contract

Make sure to have `Metamask` extension installed on your browser.

Go to [remix.ethereum.org](https://remix.ethereum.org/)

Copy the contract files, `EIP20.sol`, `EIP20Interface.sol`,
 and `LotteryContract.sol` to that website. 
 Change the compiler version to `^0.4.21` (I've tested with `0.4.26`)

Compile the contract files. 

Open the `deploy & run transactions` tab, choose `Injected Web3`

Deploy `EIP20.sol` and copy its address.

Deploy `LotteryContract.sol` by providing it the copied address of `EIP20.sol`

Copy the address of `LotteryContract.sol` (it is required in the web interface)

### How to Run

Make sure to have `node version 10` installed.

Run `npm install` in this folder.

Copy `.env.sample` to `.env`

Copy the deployed address of the LotteryContract to `.env` as such

`LOTTERY_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890`


Then, use `npm start` to start the server.

Open a browser with `metamask` extension and go to 
[localhost:8081](localhost:8081)