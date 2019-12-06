const printInfo = (...args) => {
  return console.log('\u001b[34m', ...args); // print in blue
};

module.exports = printInfo;