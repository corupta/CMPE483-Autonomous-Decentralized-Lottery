const EIP20 = artifacts.require("EIP20");
const LotteryContract = artifacts.require("LotteryContract");
const timeTravel = require("../helpers/timeTravel");
const callAndReturn = require("../helpers/callAndReturn");
const expectError = require("../helpers/expectError");

const getContracts = () => Promise.all([EIP20.deployed(), LotteryContract.deployed()]);

contract("LotteryContract", (accounts) => {
  let number = 1234;
  let bank = accounts[0];
  let john = accounts[1];
  let mark = accounts[2];
  let dave = accounts[3];
  let george = accounts[4];
  let bob = accounts[5];
  it('should not allow to purchase ticket before approving tl tokens', async () => {
    let lottery = await LotteryContract.deployed();
    let resp = await lottery.purchaseTicket.call(number, { from: john }).catch((err) => err);
    expectError(resp, "Please make sure to approve 10 TL tokens for this contract in EIP20 TL Token contract");
  });
  it('should allow to purchase ticket after approve', async () => {
    const [eip20, lottery] = await getContracts();
    await eip20.transfer(john, 10, { from: bank });
    await eip20.approve(lottery.address, 10, { from: john });
    let resp = await callAndReturn(lottery.purchaseTicket, number, { from: john }).catch((err) => err);
    expect(resp).not.to.be.an('error');
    const { lotteryNumber, ticketNumber } = resp;
    expect(lotteryNumber.toNumber(), 'lotteryNumber').to.equal(0);
    expect(ticketNumber.toNumber(), 'ticketNumber').to.equal(0);
  });
  it('should allow to purchase more tickets', async () => {
    const [eip20, lottery] = await getContracts();
    let lastTicketNumber = 0;
    for (let account of [mark, dave, george, bob]) {
      await eip20.transfer(account, 10, { from: bank });
      await eip20.approve(lottery.address, 10, { from: account });
      lastTicketNumber += 1;
      number += 4;
      const { lotteryNumber, ticketNumber } = await callAndReturn(lottery.purchaseTicket, number, { from: account });
      expect(lotteryNumber.toNumber(), 'lotteryNumber').to.equal(0);
      expect(ticketNumber.toNumber(), 'ticketNumber').to.equal(lastTicketNumber);
    }

  });
  it('should not allow to reveal number in submission stage', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await lottery.revealNumber.call(number, 0, 0, { from: john }).catch((err) => err);
    expectError(resp,"Current lottery is in submission stage, you can't reveal numbers this week.");
  });
  it('should not allow to purchase tickets in reveal stage', async () => {
    await timeTravel(7 * 24 * 3600); // go to next week
    const [eip20, lottery] = await getContracts();
    await eip20.transfer(john, 10, { from: bank });
    await eip20.approve(lottery.address, 10, { from: john });
    let resp = await lottery.purchaseTicket.call(number, { from: john }).catch((err) => err);
    expectError(resp, "Current lottery is in reveal stage, you can't purchase tickets this week.");
  });
  // ticket exists
  // ticket owner
  // not revealed
  // correct number
  it('should allow to reveal number in reveal stage', async () => {
    const [eip20, lottery] = await getContracts();

  });
  // allow more (bob forgets to allow)
  // no allow redeem before lottery finishes
  // next week
  // no allow reveal (bob) when finishes
  // no allow redeem of non existing ticket
  // no allow redeem of other's ticket
  // no allow redeem of not revealed ticket (bob)
  // allow redeem
  // no allow redeem of redeemed ticket
  // allow redeem of more people after many weeks
  // no allow reveal of tickets of unexisting lottery
  // no allow redeem of tickets of unexisting lottery
});