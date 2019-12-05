const expectError = (potentialError, expectedMessage) => {
  expect(potentialError).to.be.an('error');
  expect(potentialError.message).to.include(expectedMessage);
};

module.exports = expectError;