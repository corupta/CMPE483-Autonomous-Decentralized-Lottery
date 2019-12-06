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
    let resp = await callAndReturn(lottery.purchaseTicket, number, { from: john });
    expectError(resp, "Please make sure to approve 10 TL tokens for this contract in EIP20 TL Token contract");
  });
  it('should allow to purchase ticket after approve', async () => {
    const [eip20, lottery] = await getContracts();
    await eip20.transfer(john, 10, { from: bank });
    await eip20.approve(lottery.address, 10, { from: john });
    let resp = await callAndReturn(lottery.purchaseTicket, number, { from: john });
    expect(resp).not.to.be.an('error');
    const { lotteryNumber, ticketNumber } = resp;
    expect(lotteryNumber.toNumber(), 'lotteryNumber').to.equal(0);
    expect(ticketNumber.toNumber(), 'ticketNumber').to.equal(0);
  });
  it('should allow to purchase more tickets', async () => {
    const [eip20, lottery] = await getContracts();
    let lastTicketNumber = 0;
    let currentNumber = number;
    for (let account of [mark, dave, george, bob]) {
      await eip20.transfer(account, 10, { from: bank });
      await eip20.approve(lottery.address, 10, { from: account });
      lastTicketNumber += 1;
      currentNumber += 4;
      let resp = await callAndReturn(lottery.purchaseTicket, currentNumber, { from: account });
      expect(resp).not.to.be.an('error');
      const { lotteryNumber, ticketNumber } = resp;
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
    let resp = await callAndReturn(lottery.purchaseTicket, number, { from: john });
    expectError(resp, "Current lottery is in reveal stage, you can't purchase tickets this week.");
  });
  it('should not allow to reveal number in a non existing lottery', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number, 7, 0, { from: john });
    expectError(resp, "You can make the current action only in the current lottery.");
  });
  it('should not allow to reveal number in a non existing ticket', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number, 0, 15, { from: john });
    expectError(resp, "Ticket doesn't exists");
  });
  it('should not allow to reveal number of a not owned ticket', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number, 0, 1, { from: john });
    expectError(resp, "Ticket doesn't belong to you");
  });
  it('should not allow to reveal wrong number', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number + 3, 0, 0, { from: john });
    expectError(resp, "You revealed a wrong number, make sure to reveal the number you submitted");
  });
  it('should allow to reveal number', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number, 0, 0, { from: john });
    expect(resp).not.to.be.an('error');
  });
  it('should not allow to reveal an already revealed number', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number, 0, 0, { from: john });
    expectError(resp, "The number submitted in this ticket is already revealed before");
  })
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