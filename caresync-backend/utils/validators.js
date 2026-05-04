const mongoose = require('mongoose');

/**
 * Validate that a string is a valid MongoDB ObjectId.
 * Returns true if valid, false otherwise.
 */
const isValidObjectId = (id) => {
  const str = String(id);
  return mongoose.Types.ObjectId.isValid(str) && /^[0-9a-fA-F]{24}$/.test(str);
};

module.exports = { isValidObjectId };
