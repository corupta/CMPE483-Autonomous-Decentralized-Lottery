const EIP20 = artifacts.require("EIP20");

contract('EIP20', (accounts) => {
  it('should put 1000000 TL Token in the first account', async () => {
    const eip20Instance = await EIP20.deployed();
    const balance = await eip20Instance.balanceOf.call(accounts[0]);
    assert.equal(balance.valueOf(), 1000000, "1000000 wasn't in the first account");
  });
});
