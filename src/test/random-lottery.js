const EIP20 = artifacts.require("EIP20");
const LotteryContract = artifacts.require("LotteryContract");
const timeTravel = require("../helpers/timeTravel");
const callAndReturn = require("../helpers/callAndReturn");
const expectError = require("../helpers/expectError");
const printInfo = require("../helpers/printInfo");

const getContracts = () => Promise.all([EIP20.deployed(), LotteryContract.deployed()]);

contract('LotteryContract-RandomTest', (accounts) => {
  const bank = accounts[0];
  let participants = [];
  it('should prepare 1k participants', async () => {
    // prepare 100 participants
    for (let i = 0; i < 100; i++) {
      const address = await web3.eth.personal.newAccount("");
      await web3.eth.personal.unlockAccount(address, "");
      participants.push(address);
      await web3.eth.sendTransaction({
        from: bank, to: address, value: web3.utils.toWei("0.01", 'ether')
      });
    }
  });
  for (let i = 0; i < 5; i++) {
    // 5 rounds of lottery.
    it(`should complete lottery round ${i} successfully (stress test)`, async () => {

      const [eip20, lottery] = await getContracts();
      let totalMoneySpent = 0;
      let totalMoneyWon = 0;
      let ticketsCount = Math.floor(Math.random() * 100);
      // up to 100 tickets per round otherwise it's too slow.
      let tickets = [];
      printInfo(`#### Starting Lottery Round #${i} - (${ticketsCount} tickets)`);
      // purchase tickets
      for (let j = 0; j < ticketsCount; ++j) {
        const participantIndex = Math.floor(Math.random() * participants.length);
        const randomNumber = Math.floor(Math.random() * 4294967296);
        const account = participants[participantIndex];
        await eip20.transfer(account, 10, { from: bank });
        await eip20.approve(lottery.address, 10, { from: account });
        let accountBalance = (await eip20.balanceOf.call(account)).toNumber();
        let lotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
        let resp = await callAndReturn(lottery.purchaseTicket, randomNumber, { from: account });
        expect(resp).not.to.be.an('error');
        let { lotteryNumber, ticketNumber } = resp;
        lotteryNumber = lotteryNumber.toNumber();
        ticketNumber = ticketNumber.toNumber();
        expect(lotteryNumber, 'lotteryNumber').to.equal(i);
        expect(ticketNumber, 'ticketNumber').to.equal(j);
        let nextLotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
        expect(nextLotteryBalance, 'lottery should receive 10 TL tokens').to.equal(lotteryBalance + 10);
        let nextAccountBalance = (await eip20.balanceOf.call(account)).toNumber();
        expect(nextAccountBalance, 'account should lose 10 TL tokens').to.equal(accountBalance - 10);
        totalMoneySpent += 10;
        tickets.push({ participantIndex, account, randomNumber, lotteryNumber, ticketNumber });
      }
      printInfo(`#### Finished Purchase Stage of Lottery Round #${i}`);
      await timeTravel(7 * 24 * 3600); // go to next week
      if (ticketsCount) {
        // random shuffle tickets
        let t = ticketsCount;
        while (--t) {
          let j = Math.floor(Math.random() * (t+1)); // pick t and j to swap
          // swap tickets[t] and tickets[j]
          let temp = tickets[t];
          tickets[t]=tickets[j];
          tickets[j] = temp;
        }
      }
      // reveal tickets
      for (let j = 0; j < ticketsCount; ++j) {
        const { participantIndex, account, randomNumber, lotteryNumber, ticketNumber } = tickets[j];
        let resp = await callAndReturn(lottery.revealNumber, randomNumber, lotteryNumber, ticketNumber, { from: account });
        expect(resp).not.to.be.an('error');
      }
      printInfo(`#### Finished Reveal Stage of Lottery Round #${i}`);
      await timeTravel(7 * 24 * 3600); // go to next week
      // redeem tickets
      for (let j = 0; j < ticketsCount; ++j) {
        const { participantIndex, account, lotteryNumber, ticketNumber } = tickets[j];
        let accountBalance = (await eip20.balanceOf.call(account)).toNumber();
        let lotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
        let resp = await callAndReturn(lottery.redeemTicket, lotteryNumber, ticketNumber, { from: account });
        expect(resp).not.to.be.an('error');
        let wonAmount = resp.toNumber();
        expect(wonAmount, 'won TL tokens must be in range [0,totalMoneySpent]').to.be.within(0, totalMoneySpent);
        let nextAccountBalance = (await eip20.balanceOf.call(account)).toNumber();
        expect(nextAccountBalance, 'account should receive won TL tokens').to.equal(accountBalance + wonAmount);
        let nextLotteryBalance = (await eip20.balanceOf.call(lottery.address)).toNumber();
        expect(nextLotteryBalance, 'lottery should lose won TL tokens').to.equal(lotteryBalance - wonAmount);
        totalMoneyWon += wonAmount;
        if (wonAmount > 0) {
          // don't print 0 TLs to keep the console clean
          printInfo(`    Participant #${participantIndex} with Ticket #${ticketNumber} won`, wonAmount, 'TL Tokens');
        }
      }
      expect(totalMoneySpent, 'all spent money must be awarded when all tickets are redeemed').to.equal(totalMoneyWon);
      printInfo(`#### Finished Lottery Round #${i}, (${ticketsCount} tickets) Total Money Spent & Won:`, totalMoneySpent);
    });
  }
});