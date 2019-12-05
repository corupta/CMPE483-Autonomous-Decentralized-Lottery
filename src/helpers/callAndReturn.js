const callAndReturn = async (x, ...args) => {
  const returnValue = await x.call(...args);
  await x(...args);
  return returnValue;
};
module.exports = callAndReturn;