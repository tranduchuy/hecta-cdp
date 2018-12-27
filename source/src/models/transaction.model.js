const UserModel = require('./user.model');
const {sequelize} = require('../services/db');
const Sequelize = require('sequelize');

/**
 * @typedef {Object} TransactionCols
 * @property {number} id
 * @property {date} createdAt
 * @property {date} updatedAt
 * @property {number} type
 * @property {string} content
 * @property {number} userId
 * @property {number} fromUserId
 * @property {number} amount
 * @property {string} note
 * @property {number} bCredit
 * @property {number} bMain1
 * @property {number} bMain2
 * @property {number} bPromo
 * @property {number} aCredit
 * @property {number} aMain1
 * @property {number} aMain2
 * @property {number} aPromo
 *
 * @typedef {Model & TransactionCols} TransactionModel
 *
 * */

const transactionSchema = {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ID',
    primaryKey: true,
    autoIncrement: true
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
  type: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'TYPE'
  },
  content: {
    type: Sequelize.DataTypes.TEXT,
    field: 'CONTENT',
    defaultValue: ''
  },
  userId: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'USER_ID',
    references: {
      model: UserModel,
      key: 'id'
    }
  },
  fromUserId: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'FROM_USER_ID',
    references: {
      model: UserModel,
      key: 'id'
    }
  },
  amount: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'AMOUNT'
  },
  note: {
    type: Sequelize.DataTypes.TEXT,
    field: 'NOTE',
    defaultValue: ''
  },
  bCredit: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'B_CREDIT',
    defaultValue: 0
  },
  bMain1: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'B_MAIN_1',
    defaultValue: 0
  },
  bMain2: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'B_MAIN_2',
    defaultValue: 0
  },
  bPromo: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'B_PROMO',
    defaultValue: 0
  },
  aCredit: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'A_CREDIT',
    defaultValue: 0
  },
  aMain1: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'A_MAIN_1',
    defaultValue: 0
  },
  aMain2: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'A_MAIN_2',
    defaultValue: 0
  },
  aPromo: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'A_PROMO',
    defaultValue: 0
  }
};

const Transaction = sequelize.define('transaction', transactionSchema, {
  freezeTableName: true,
  tableName: 'TRANSACTION'
});
module.exports = Transaction;

Transaction.belongsTo(UserModel, {
  foreignKey: 'fromUserId',
    constraints: false,
    as: 'fromUserInfo'
});
    