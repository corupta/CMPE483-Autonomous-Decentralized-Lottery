const EIP20 = artifacts.require("EIP20");
const LotteryContract = artifacts.require("LotteryContract");

module.exports = function(deployer) {
  deployer.deploy(EIP20, 1000000000, 'TL Token', 0, 'TL').then(function() {
    return deployer.deploy(LotteryContract, EIP20.address);
  });
};
