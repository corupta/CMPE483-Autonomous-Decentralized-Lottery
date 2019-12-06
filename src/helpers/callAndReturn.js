const callAndReturn = async (x, ...args) => {
  try {
    const returnValue = await x.call(...args);
    await x(...args);
    return returnValue;
  } catch (error) {
    return error;
  }
};
module.exports = callAndReturn;