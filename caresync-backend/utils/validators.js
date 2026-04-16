const mongoose = require('mongoose');

/**
 * Validate that a string is a valid MongoDB ObjectId.
 * Returns true if valid, false otherwise.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

module.exports = { isValidObjectId };
