const log4js = require('log4js');
const logger = log4js.getLogger('Services');
const bcrypt = require('bcrypt');

/**
 * Compare hash password with input plain text
 * @param hashed
 * @param plainText
 * @returns {boolean}
 * @private
 */
const checkHashPassword = (hashed, plainText) => {
  try {
    return bcrypt.compareSync(plainText, hashed);
  } catch (e) {
    logger.error('UserService::__checkHashPassword::error', e);
    return false;
  }
};

module.exports = {
  checkHashPassword
};