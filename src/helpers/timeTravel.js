const jsonrpc = '2.0'
const id = 0
const send = (method, params = []) => new Promise((resolve, reject) => {
  web3.currentProvider.send({ id, jsonrpc, method, params }, (err, result) => {
    if (err) { return reject(err); }
    return resolve(result);
  });
});


const timeTravel = async seconds => {
  await send('evm_increaseTime', [seconds]);
  await send('evm_mine')
};
module.exports = timeTravel;