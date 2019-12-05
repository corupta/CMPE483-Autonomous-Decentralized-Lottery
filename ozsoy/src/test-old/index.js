loadScript("./contracts.js");

eth.defaultAccount = eth.accounts[0];
personal.unlockAccount(eth.defaultAccount, "");

loadScript("./helpers.js");

["test1.js","test2.js","test3.js"].forEach(loadScript);

printSummary();
