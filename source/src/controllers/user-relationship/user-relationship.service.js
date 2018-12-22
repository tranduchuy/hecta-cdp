const GlobalConstant = require('../../constants/global.constant');
const StatusConstant = require('../../constants/status.constant');
const UserConstant = require('../../controllers/user/user.constant');
const UserTypeConstant = require('../../constants/user-type.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);
const Sequelize = require('sequelize');
const RandomString = require('randomstring');
const bcrypt = require('bcrypt');

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
 *
 * @param userId
 * @param {{limit, page, sortBy, sortDirection}} options
 * @return {Promise<void>}
 */
const getListChildren = async (userId, options) => {
  return await UserRelationshipModel.findAndCountAll({
    where: {
      parentId: userId
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

const isValidToBeChild = async (userId) => {
  const roleChildRelations = await UserRelationshipModel.findOne({
    where: {
      childId: userId
    }
  });

  const roleParentRelation = await UserRelationshipModel.findOne({
    where: {
      parentId: userId
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
 * @param {number} parentId
 * @param {number} childId
 * @return {Promise<boolean>}
 */
async function isExistRelation(parentId, childId) {
  const relation = await UserRelationshipModel.findOne({
    where: {
      parentId,
      childId
    }
  });

  return !!relation;
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
 * @param {string} email
 * @param {string} password
 * @param {string} name
 * @param {string} username
 * @param {string | null} phone
 * @param {string | null} address
 * @param {number | null} gender
 * @return {Promise<this|Errors.ValidationError>}
 */
const registerNewChild = async ({email, password, name, username, phone, address, gender}) => {
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
    status: StatusConstant.PendingOrWaitConfirm
  });

  return await newUser.save();
};

module.exports = {
  isValidToBeChild,
  isExistRelation,
  createNewRelation,
  getListChildren,
  mapQueryToValidObjectSort,
  registerNewChild
};