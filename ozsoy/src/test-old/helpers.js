var testCaseNumber = 1;
var successCount = 0;

function should(condition, message) {
  console.log((condition ? "\x1b[32mSuccessful" : "\x1b[31mFailed") + " Test Case", testCaseNumber, "-", message);
  testCaseNumber += 1;
  successCount += (condition ? 1 : 0);
}

function newAccount() {
  var account = personal.newAccount("");
  eth.sendTransaction({ from: eth.defaultAccount, to: account, value:	web3.toWei(1000,	"ether")});
  personal.unlockAccount(account, "");
  return account;
}

function from(account) {
  return { from: account };
}

function printSummary() {
  console.log("\x1b[32mSuccessful test cases count:", successCount);
  console.log("\x1b[31mFailed test cases count:", testCaseNumber - successCount - 1);
}