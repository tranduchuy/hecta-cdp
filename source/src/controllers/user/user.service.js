const UserModel = require('../../models/user.model');
const Sequelize = require('sequelize');
const log4js = require('log4js');
const logger = log4js.getLogger('Services');
const bcrypt = require('bcrypt');
const MailService = require('../../services/mailer.service');

// constant files
const UserConstant = require('./user.constant');
const RandomString = require('randomstring');
const StatusConstant = require('../../constants/status.constant');

/**
 * Compare hash password with input plain text
 * @param hashed
 * @param plainText
 * @returns {boolean}
 * @private
 */
const isValidHashPassword = (hashed, plainText) => {
  try {
    return bcrypt.compareSync(plainText, hashed);
  } catch (e) {
    logger.error('UserService::__checkHashPassword::error', e);
    return false;
  }
};

/**
 *
 * @param email
 * @param password
 * @param type
 * @param name
 * @param username
 * @param phone
 * @returns {Promise<this|Errors.ValidationError>|*|void}
 */
const createUser = async ({email, password, type, name, username, phone}) => {
  const salt = bcrypt.genSaltSync(UserConstant.saltLength);
  const tokenEmailConfirm = RandomString.generate({length: UserConstant.tokenConfirmEmailLength, charset: 'alphabetic'});

  const newUser = UserModel.build({
    email,
    passwordHash: bcrypt.hashSync(password, salt),
    passwordSalt: salt,
    type,
    name,
    username,
    phone,
    tokenEmailConfirm,
    status: StatusConstant.PendingOrWaitConfirm
  });

  // Send email
  MailService.sendConfirmEmail(email, tokenEmailConfirm);
  return await newUser.save();
};


const findByEmailOrUsername = async (email, username) => {
  return await UserModel.findAll({
    where: {
      [Sequelize.Op.or]: [{email}, {username}]
    }
  });
};

module.exports = {
  isValidHashPassword,
  createUser,
  findByEmailOrUsername
};