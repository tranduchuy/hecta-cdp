/**
 * @typedef {Object} UserRelationshipCols
 * @property {number} id
 * @property {number} parentId
 * @property {number} childId
 * @property {date} createdAt
 * @property {date} updatedAt
 * @property {number} credit
 * @property {number} delFlag
 * @property {number} status
 * @property {number} usedCredit
 *
 * @typedef {Model & UserRelationshipCols} UserRelationShipModel
 */

const StatusConstant = require('../constants/status.constant');
const GlobalConstant = require('../constants/global.constant');
const UserModel = require('./user.model');
const {sequelize} = require('../services/db');
const Sequelize = require('sequelize');

const userRelationShipSchema = {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ID',
    primaryKey: true,
    autoIncrement: true
  },
  parentId: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'PARENT_ID',
    references: {
      model: UserModel,
      key: 'id'
    }
  },
  childId: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'CHILD_ID',
    references: {
      model: UserModel,
      key: 'id'
    }
  },
  credit: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'CREDIT',
    defaultValue: 0
  },
  status: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'STATUS',
    defaultValue: StatusConstant.ChildWaiting
  },
  usedCredit: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'USED_CREDIT',
    defaultValue: 0
  },
  delFlag: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'DEL_FLAG',
    defaultValue: GlobalConstant.DelFlag.False
  },
  createdAt: {
    type: Sequelize.DataTypes.DATE,
    field: 'CREATED_AT',
    defaultValue: Sequelize.DataTypes.NOW
  },
  updatedAt: {
    type: Sequelize.DataTypes.DATE,
    field: 'UPDATED_AT',
    defaultValue: Sequelize.DataTypes.NOW
  }
};

const UserRelationShip = sequelize.define('userRelationship', userRelationShipSchema, {
  freezeTableName: true,
  tableName: 'USER_RELATIONSHIP'
});

module.exports = UserRelationShip;

UserRelationShip.belongsTo(UserModel, {
  foreignKey: 'childId',
  constraints: false,
  as: 'childInfo' // name
});

UserRelationShip.belongsTo(UserModel, {
  foreignKey: 'parentId',
  constraints: false,
  as: 'parentInfo'
});