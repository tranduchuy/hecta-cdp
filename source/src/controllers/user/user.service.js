/**
 * @type UserModel
 */
const UserModel = require('../../models/user.model');
/**
 * @type Model
 */
const BalanceModel = require('../../models/balance.model');
/**
 * @type Model
 */
const UserRelationShipModel = require('../../models/user-relationship.model');
/**
 * @type Model
 */
const TransactionModel = require('../../models/transaction.model');
const Sequelize = require('sequelize');
const log4js = require('log4js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const moment = require('moment');
const randomString = require('randomstring');

// constant files
const UserConstant = require('./user.constant');
const UserTypeConstant = require('../../constants/user-type.constant');
const RandomString = require('randomstring');
const StatusConstant = require('../../constants/status.constant');
const GlobalConstant = require('../../constants/global.constant');
const TransactionTypeConstant = require('../../constants/transaction-type.constant');
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

/**
 * Get balance info of user. If user is personal account then get more info of credit and usedCredit
 * @param userId
 * @return {{main1, main2, promo, credit?, usedCredit?}}
 */
const getBalanceInfo = async (userId) => {
  const user = await UserModel.findById(userId);
  const balance = await BalanceModel.findOne({userId});
  const result = {
    main1: balance.main1,
    main2: balance.main2,
    promo: balance.promo
  };

  if (user.type === UserTypeConstant.Personal) {
    result.credit = 0;
    result.usedCredit = 0;
    const relation = await UserRelationShipModel.findOne({
      childId: userId,
      status: StatusConstant.ChildAccepted
    });

    if (relation) {
      result.credit = relation.credit;
      result.usedCredit = relation.usedCredit;
    }
  }

  return result;
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

/**
 * Update MAIN_1 money of userId
 * @param {number} userId
 * @param {number} amount
 * @return {Promise<Promise<this|Errors.ValidationError>|*|void>}
 */
const updateMain1 = async (userId, amount) => {
  const balance = await BalanceModel.findOne({
    userId
  });

  balance.main1 = balance.main1 + amount;
  return balance.save();
};

const addTransactionForParentShareCredit = async (parentId, childId, amount, before, after) => {
  const newTransaction = TransactionModel.build({
    userId: parentId,
    fromUserId: childId,
    amount,
    type: TransactionTypeConstant.ShareCredit,
    content: 'Parent share credit to child',
    note: '',
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
};

const addTransactionForChildReceiveCredit = async (parentId, childId, amount, before, after) => {
  const newTransaction = TransactionModel.build({
    userId: parentId,
    fromUserId: childId,
    amount,
    type: TransactionTypeConstant.ReceiveCredit,
    content: 'Child receive credit from parent',
    note: '',
    bCredit: before.credit || 0,
    bMain1: before.main1,
    bMain2: before.main2,
    bPromo: before.promo,
    aCredit: after.credit || 0,
    aMain1: after.main1,
    aMain2: after.main2,
    aPromo: after.promo
  });

  return await newTransaction.save();
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
  isExpiredTokenResetPassword,
  updateMain1,
  addTransactionForParentShareCredit,
  addTransactionForChildReceiveCredit
};