const EIP20 = artifacts.require("EIP20");
const LotteryContract = artifacts.require("LotteryContract");
const timeTravel = require("../helpers/timeTravel");
const callAndReturn = require("../helpers/callAndReturn");
const expectError = require("../helpers/expectError");
const printInfo = require("../helpers/printInfo");

const getContracts = () => Promise.all([EIP20.deployed(), LotteryContract.deployed()]);

contract("LotteryContract", (accounts) => {
  let number = 1234;
  let bank = accounts[0];
  let john = accounts[1];
  let mark = accounts[2];
  let dave = accounts[3];
  let george = accounts[4];
  let bob = accounts[5];
  let totalMoneySpent = 0;
  let totalMoneyWon = 0;
  it('should not allow to purchase ticket before approving tl tokens', async () => {
    let lottery = await LotteryContract.deployed();
    let resp = await callAndReturn(lottery.purchaseTicket, number, { from: john });
    expectError(resp, "Please make sure to approve 10 TL tokens for this contract in EIP20 TL Token contract");
  });
  it('should allow to purchase ticket after approve', async () => {
    const [eip20, lottery] = await getContracts();
    await eip20.transfer(john, 10, { from: bank });
    await eip20.approve(lottery.address, 10, { from: john });
    let lotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
    let johnBalance = (await eip20.balanceOf.call(john)).toNumber();
    let resp = await callAndReturn(lottery.purchaseTicket, number, { from: john });
    expect(resp).not.to.be.an('error');
    const { lotteryNumber, ticketNumber } = resp;
    expect(lotteryNumber.toNumber(), 'lotteryNumber').to.equal(0);
    expect(ticketNumber.toNumber(), 'ticketNumber').to.equal(0);
    let nextLotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
    expect(nextLotteryBalance, 'lottery should receive 10 TL tokens').to.equal(lotteryBalance + 10);
    let nextJohnBalance = (await eip20.balanceOf.call(john)).toNumber();
    expect(nextJohnBalance, 'john should lose 10 TL tokens').to.equal(johnBalance - 10);
    totalMoneySpent += 10;
  });
  it('should allow to purchase more tickets', async () => {
    const [eip20, lottery] = await getContracts();
    let lastTicketNumber = 0;
    let currentNumber = number;
    for (let account of [mark, dave, george, bob]) {
      await eip20.transfer(account, 10, { from: bank });
      await eip20.approve(lottery.address, 10, { from: account });
      let accountBalance = (await eip20.balanceOf.call(account)).toNumber();
      let lotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
      lastTicketNumber += 1;
      currentNumber += 4;
      let resp = await callAndReturn(lottery.purchaseTicket, currentNumber, { from: account });
      expect(resp).not.to.be.an('error');
      const { lotteryNumber, ticketNumber } = resp;
      expect(lotteryNumber.toNumber(), 'lotteryNumber').to.equal(0);
      expect(ticketNumber.toNumber(), 'ticketNumber').to.equal(lastTicketNumber);
      let nextLotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
      expect(nextLotteryBalance, 'lottery should receive 10 TL tokens').to.equal(lotteryBalance + 10);
      let nextAccountBalance = (await eip20.balanceOf.call(account)).toNumber();
      expect(nextAccountBalance, 'account should lose 10 TL tokens').to.equal(accountBalance - 10);
      totalMoneySpent += 10;
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
  it('should not allow to reveal number in a future lottery', async () => {
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
  });
  it('should allow to reveal more numbers', async () => {
    const [eip20, lottery] = await getContracts();
    let currentTicketNumber = 0;
    let currentNumber = number;
    // important: Bob forgets to reveal!
    for (let account of [mark, dave, george /*, bob*/ ]) {
      currentTicketNumber += 1;
      currentNumber += 4;
      let resp = await callAndReturn(lottery.revealNumber, currentNumber, 0, currentTicketNumber, { from: account });
      expect(resp).not.to.be.an('error');
    }
  });
  it('should not allow to redeem ticket before lottery finishes', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.redeemTicket, 0, 0, { from: john });
    expectError(resp, "You can make the current action only in the past lotteries.");
  });
  it('should not allow to reveal after lottery finishes', async () => {
    await timeTravel(7 * 24 * 3600); // go to next week
    // remember that Bob forgot to reveal his number
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number, 0, 4, { from: bob });
    expectError(resp, "You can make the current action only in the current lottery.");
  });
  it('should not allow redeem ticket in a future lottery', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.redeemTicket, 7, 0, { from: john });
    expectError(resp, "You can make the current action only in the past lotteries.");
  });
  it('should not allow redeem of non existing ticket', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.redeemTicket, 0, 15, { from: john });
    expectError(resp, "Ticket doesn't exists");
  });
  it('should not allow to redeem a not owned ticket', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.redeemTicket, 0, 1, { from: john });
    expectError(resp, "Ticket doesn't belong to you");
  });
  it('should not allow to redeem a ticket with a not revealed number', async () => {
    // remember that Bob forgot to reveal his number
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.redeemTicket, 0, 4, { from: bob });
    expectError(resp, "The number submitted in this ticket was not revealed before");
  });
  it('should allow redeem of a valid ticket', async () => {
    const [eip20, lottery] = await getContracts();
    let johnBalance = (await eip20.balanceOf.call(john)).toNumber();
    let lotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
    let resp = await callAndReturn(lottery.redeemTicket, 0, 0, { from: john });
    expect(resp).not.to.be.an('error');
    let wonAmount = resp.toNumber();
    expect(wonAmount, 'won TL tokens must be in range [0,totalMoneySpent]').to.be.within(0, totalMoneySpent);
    let nextJohnBalance = (await eip20.balanceOf.call(john)).toNumber();
    expect(nextJohnBalance, 'john should receive won TL tokens').to.equal(johnBalance + wonAmount);
    let nextLotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
    expect(nextLotteryBalance, 'lottery should lose won TL tokens').to.equal(lotteryBalance - wonAmount);
    totalMoneyWon += wonAmount;
    printInfo('John won', wonAmount, 'TL Tokens');
  });
  it('should not allow redeem of an already redeemed ticket', async () => {
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.redeemTicket, 0, 0, { from: john });
    expectError(resp, "The requested ticket is already redeemed before");
  });
  it('should allow redeem of more people after many weeks', async () => {
    await timeTravel(9 * 7 * 24 * 3600); // go to 9 weeks later
    const [eip20, lottery] = await getContracts();
    let currentTicketNumber = 0;
    for (let account of [mark, dave, george /*, bob*/ ]) {
      currentTicketNumber += 1;
      let accountBalance = (await eip20.balanceOf.call(account)).toNumber();
      let lotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
      let resp = await callAndReturn(lottery.redeemTicket, 0, currentTicketNumber, { from: account });
      expect(resp).not.to.be.an('error');
      let wonAmount = resp.toNumber();
      expect(wonAmount, 'won TL tokens must be in range [0,totalMoneySpent]').to.be.within(0, totalMoneySpent);
      let nextAccountBalance = (await eip20.balanceOf.call(account)).toNumber();
      expect(nextAccountBalance, 'john should receive won TL tokens').to.equal(accountBalance + wonAmount);
      let nextLotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
      expect(nextLotteryBalance, 'lottery should lose won TL tokens').to.equal(lotteryBalance - wonAmount);
      totalMoneyWon += wonAmount;
      printInfo(`${
        account === mark ? 'Mark'
          : account === dave ? 'Dave'
          : account === george ? 'George'
            : 'UnknownAccount'
      } won`, wonAmount, 'TL Tokens');
    }
  });
  it('should have been awarded all money spent when all tickets are redeemed', async () => {
    expect(totalMoneySpent, 'all spent money must be awarded when all tickets are redeemed').to.equal(totalMoneyWon);
  });
  it('should not allow reveal number in a non existing lottery', async() => {
    // lottery 1-2-3-4 was skipped since 9 weeks was skipped.
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.revealNumber, number, 2, 0, { from: john });
    expectError(resp, "You can make the current action only in the current lottery.");
  });
  it('should not allow redeem ticket in a non existing lottery', async () => {
    // lottery 1-2-3-4 was skipped since 9 weeks was skipped.
    const [eip20, lottery] = await getContracts();
    let resp = await callAndReturn(lottery.redeemTicket, 2, 0, { from: john });
    expectError(resp, "Lottery doesn't exists, or skipped due to no submission.");
  })
});