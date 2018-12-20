const UserModel = require('../../models/user.model');
const BalanceModel = require('../../models/balance.model');
const UserRelationShipModel = require('../../models/user-relationship.model');
const Sequelize = require('sequelize');
const log4js = require('log4js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const {sequelize} = require('../../services/db');
const moment = require('moment');
const randomString = require('randomstring');

// constant files
const UserConstant = require('./user.constant');
const RandomString = require('randomstring');
const StatusConstant = require('../../constants/status.constant');
const GlobalConstant = require('../../constants/global.constant');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Service);
/**
 * Compare hash password with input plain text
 * @param {string} hashed
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

  return await newUser.save();
};

/**
 * Find user in database by user name or email. Get one
 * @param {string} email
 * @param {string} username
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
 * @param {object} data
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

/**
 * Check user can update type or not. Will be NOT permitted to be updated if
 * + parent of children
 * + child of a parent
 * @param {string | number} userId
 * @returns {Promise<Array>}
 */
const isValidUpdateType = async (userId) => {
  try {
    const findParentResult = await UserRelationShipModel.findAndCountAll({
      where: {
        userId
      }
    });

    if (findParentResult.count > 0) {
      return ['Your are child of another account'];
    }

    const findChildrenResult = await UserRelationShipModel.findAndCountAll({
      where: {
        parentId: userId
      }
    });

    if (findChildrenResult.count > 0) {
      return ['Your are parent of another accounts'];
    }

    return [];
  } catch (e) {
    logger.error('UserService::isValidUpdateType::error', e);
    return [e.message];
  }
};

/**
 * Block a user when he/she forgot password, then create token to reset password
 * @param {UserModel} user
 * @returns {Promise<*>}
 */
const blockUserForgetPassword = async (user) => {
  const reminderToken = RandomString.generate();
  const reminderExpired = moment().add(2, 'hours');

  user['status'] = StatusConstant.BlockedByForgetPassword;
  user['passwordHash'] = bcrypt.hashSync(randomString.generate(10), user['passwordSalt']);
  user['passwordReminderToken'] = reminderToken;
  user['passwordReminderExpire'] = reminderExpired;

  return await user.save();
};

/**
 *
 * @param {Date} expiredOn
 * @returns {boolean}
 */
const isExpiredTokenResetPassword = (expiredOn) => {
  return moment().isBefore(moment(expiredOn));
};

module.exports = {
  createBalanceInfo,
  createUser,
  findByEmailOrUsername,
  getBalanceInfo,
  generateToken,
  isValidHashPassword,
  isValidUpdateType,
  blockUserForgetPassword,
  isExpiredTokenResetPassword
};