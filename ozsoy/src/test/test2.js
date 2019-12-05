const EIP20 = artifacts.require("EIP20");
const LotteryContract = artifacts.require("LotteryContract");
const timeTravel = require("../helpers/timeTravel");

contract("LotteryContract", async(accounts) => {
  let number = 1;
  it('should not allow to purchase ticket before approving tl tokens', async () => {
    let john = await web3.eth.personal.newAccount('');
    let lottery = await LotteryContract.deployed();
    let resp = await lottery.purchaseTicket.call(number, { from: john }).catch((err) => err);
    expect(resp).to.be.an('error');
  });
  it('should allow to purchase ticket after approve', async () => {
    let john = await web3.eth.personal.newAccount('');
    let lottery = await LotteryContract.deployed();
    let eip20 = await EIP20.deployed();
    await eip20.transfer.call(john, 10);
    console.log('lottery address', lottery.address);
    await eip20.approve.call(lottery.address, 10, { from: john });
    let bal = await eip20.balanceOf.call(john);
    console.log('bal', bal.valueOf());
    let resp = await lottery.purchaseTicket.call(number, { from: john }).catch((err) => err);
    expect(resp).not.to.be.an('error');
    console.log('resp', resp);
  });
});