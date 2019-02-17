const GlobalConstant = require('../../constants/global.constant');
const StatusConstant = require('../../constants/status.constant');
const UserConstant = require('../../controllers/user/user.constant');
const UserTypeConstant = require('../../constants/user-type.constant');
const TransactionTypeConstant = require('../../constants/transaction-type.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);
const Sequelize = require('sequelize');
const RandomString = require('randomstring');
const bcrypt = require('bcrypt');
const UserService = require('../user/user.service');

// models
/**
 * @type UserRelationShipModel
 */
const UserRelationshipModel = require('../../models/user-relationship.model');
/**
 * @type UserModel
 */
const UserModel = require('../../models/user.model');
/**
 * @type TransactionModel
 */
const TransactionModel = require('../../models/transaction.model');

/**
 *
 * @param userId
 * @param {{limit, page, sortBy, sortDirection}} options
 * @return {Promise<void>}
 */
const getListChildren = async (userId, options) => {
  return await UserRelationshipModel.findAndCountAll({
    where: {
      parentId: userId,
      delFlag: GlobalConstant.DelFlag.False
    },
    include: [
      {
        model: UserModel,
        as: 'childInfo',
        attributes: ['email', 'name', 'username', 'phone', 'address', 'gender', 'avatar', 'status']
      }
    ],
    order: [
      [
        {model: UserModel, as: 'childInfo'},
        options.sortBy,
        options.sortDirection.toLowerCase()
      ]
    ],
    offset: options.limit * (options.page - 1),
    limit: options.limit
  });
};

/**
 * Check if target user can be child or not. If user is a ACTIVE child return false, if user is a ACTIVE parent return false, else true
 * @param userId
 * @return {Promise<boolean>}
 */
const isValidToBeChild = async (userId) => {
  const roleChildRelations = await UserRelationshipModel.findOne({
    where: {
      childId: userId,
      status: StatusConstant.ChildAccepted,
      delFlag: GlobalConstant.DelFlag.False
    }
  });

  const roleParentRelation = await UserRelationshipModel.findOne({
    where: {
      parentId: userId,
      status: StatusConstant.ChildAccepted,
      delFlag: GlobalConstant.DelFlag.False
    }
  });

  return !(roleChildRelations || roleParentRelation);
};

/**
 *
 * @param {number} parentId
 * @param {number} childId
 * @return {Promise<this|Errors.ValidationError>}
 */
async function createNewRelation(parentId, childId) {
  const newRelation = UserRelationshipModel.build({
    parentId,
    childId
  });

  return await newRelation.save();
}

/**
 *
 * @param parentId
 * @param childId
 * @return {Promise<UserRelationShipModel>}
 */
async function isExistRelation(parentId, childId) {
  return await UserRelationshipModel.findOne({
    where: {
      parentId,
      childId,
      delFlag: GlobalConstant.DelFlag.False
    }
  });
}

/**
 *
 * @param {{limit, page, sortBy, sortDirection}} options
 * @return {Object}
 */
function mapQueryToValidObjectSort(options) {
  return {
    sortBy: options.sortBy || 'name',
    sortDirection: options.sortDirection || 'asc'
  }
}

/**
 * Register new user as child of current logged in user
 * @param email
 * @param password
 * @param name
 * @param username
 * @param phone
 * @param address
 * @param gender
 * @param city
 * @param district
 * @param ward
 * @param birthday
 * @return {Promise<this|Errors.ValidationError>}
 */
const registerNewChild = async ({email, password, name, username, phone, address, gender, city, district, ward, birthday}) => {
  const salt = bcrypt.genSaltSync(UserConstant.saltLength);
  const tokenEmailConfirm = RandomString.generate({
    length: UserConstant.tokenConfirmEmailLength,
    charset: 'alphabetic'
  });

  const newUser = UserModel.build({
    email,
    passwordHash: bcrypt.hashSync(password, salt),
    passwordSalt: salt,
    type: UserTypeConstant.Personal,
    name,
    username,
    phone,
    tokenEmailConfirm,
    address,
    gender,
    city,
    district,
    ward,
    birthday,
    status: StatusConstant.PendingOrWaitConfirm
  });

  return await newUser.save();
};

const findRelationship = async (parentId, childId) => {
  return await UserRelationshipModel.findOne({
    where: {
      parentId,
      childId,
      delFlag: GlobalConstant.DelFlag.False
    }
  });
};

/**
 *
 * @param parentId
 * @param childId
 * @param amount
 * @param before
 * @param after
 * @param note
 * @return {Promise<UserRelationshipModel|Errors.ValidationError>}
 */
const createTransactionTakeMoneyBack = async ({parentId, childId, amount, before, after, note}) => {
  const newTransaction = TransactionModel.build({
    userId: parentId,
    fromUserId: childId,
    amount,
    type: TransactionTypeConstant.TakeBackMoney,
    content: 'Parent get credit back',
    note,
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

const createTransactionReturnMoney = async ({parentId, childId, amount, before, after, note}) => {
  const newTransaction = TransactionModel.build({
    userId: childId,
    fromUserId: parentId,
    amount,
    type: TransactionTypeConstant.ReturnMoney,
    content: 'Return credit for parent',
    note,
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

/**
 *
 * @param parentId
 * @param childId
 * @param {UserRelationShipModel} relation
 * @return {Promise<void>}
 */
const doProcessGetBackParentMoney = async (parentId, childId, relation) => {
  const bParentBalance = await UserService.getBalanceInfo(parentId);
  const bChildBalance = await UserService.getBalanceInfo(childId);
  const amount = relation.credit;

  // 1. reset relation credit
  const aParentBalance = Object.assign({}, bParentBalance, {main1: bParentBalance.main1 + amount});
  const aChildBalance = Object.assign({}, bChildBalance, {credit: 0});
  relation.credit = 0;
  await relation.save();
  logger.info(`UserRelationShipService::doProcessGetBackParentMoney::update relation.credit to 0 successfully. Relation id ${relation.id}`);

  // 2. update parent's main1
  await UserService.updateMain1(parentId, amount);
  logger.info(`UserRelationShipService::doProcessGetBackParentMoney::update parent's main1 successfully. New value ${aParentBalance.main1}. Parent's id ${parentId}`);

  // 3. create transaction get money back
  const t1 = await createTransactionTakeMoneyBack({parentId, childId, amount, after: aParentBalance, before: bParentBalance, note: ''});
  logger.info(`UserRelationShipService::doProcessGetBackParentMoney::create transaction take money back. Transaction id ${t1.id}`);

  // 4. create transaction return money
  const t2 = await createTransactionReturnMoney({parentId, childId, amount, after: aChildBalance, before: bChildBalance, note: ''});
  logger.info(`UserRelationShipService::doProcessGetBackParentMoney::create transaction return money. Transaction id ${t2.id}`);

  return aParentBalance;
};

module.exports = {
  isValidToBeChild,
  isExistRelation,
  createNewRelation,
  getListChildren,
  mapQueryToValidObjectSort,
  registerNewChild,
  findRelationship,
  doProcessGetBackParentMoney
};