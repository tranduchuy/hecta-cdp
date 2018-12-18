const UserModel = require('../../models/user.model');
const BalanceModel = require('../../models/balance.model');
const Sequelize = require('sequelize');
const log4js = require('log4js');
const logger = log4js.getLogger('Services');
const bcrypt = require('bcrypt');
const MailService = require('../../services/mailer.service');
const jwt = require('jsonwebtoken');
const config = require('config');
const {sequelize} = require('../../services/db');

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
  const tokenEmailConfirm = RandomString.generate({
    length: UserConstant.tokenConfirmEmailLength,
    charset: 'alphabetic'
  });

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

/**
 * Find user in database by user name or email. Get one
 * @param email string
 * @param username string
 * @returns {Promise<*>}
 */
const findByEmailOrUsername = async (email, username) => {
  return await UserModel.findOne({
    where: {
      [Sequelize.Op.or]: [{email}, {username}]
    }
  });
};

/**
 * Generate token by data
 * @param data object
 * @returns {string}
 */
const generateToken = (data) => {
  const secretKey = config.get('jwt').secret;
  return jwt.sign(data, secretKey, {
    expiresIn: (60 * 60) * UserConstant.tokenExpiredInHour
  });
};

const createBalanceInfo = async (userId) => {
  const newBalance = BalanceModel.build({userId});
  return await newBalance.save();
};

const getBalanceInfo = async (userId) => {
  const balance = await BalanceModel.findOne({userId});

  return {
    main1: balance.main1,
    main2: balance.main2,
    promo: balance.promo
  };
};

module.exports = {
  isValidHashPassword,
  createUser,
  findByEmailOrUsername,
  generateToken,
  createBalanceInfo,
  getBalanceInfo
};