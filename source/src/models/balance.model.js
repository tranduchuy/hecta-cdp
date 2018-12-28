const UserModel = require('./user.model');
const {sequelize} = require('../services/db');
const Sequelize = require('sequelize');

/**
 *
 * @typedef Object BalanceCols
 * @property {number} id
 * @property {number} main1
 * @property {number} main2
 * @property {number} promo
 * @property {date} createdAt
 * @property {date} updatedAt
 * @property {number} userId
 *
 * @typedef {Model & BalanceCols} BalanceModel
 *
 */

const balanceSchema = {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ID',
    primaryKey: true,
    autoIncrement: true
  },
  main1: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'MAIN_1',
    defaultValue: 0
  },
  main2: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'MAIN_2',
    defaultValue: 0
  },
  promo: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'PROMO',
    defaultValue: 0
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
  },
  userId: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'USER_ID',
    references: {
      model: UserModel,
      key: 'id'
    }
  }
};

const Balance = sequelize.define('balance', balanceSchema, {
  freezeTableName: true,
  tableName: 'BALANCE'
});

module.exports = Balance;