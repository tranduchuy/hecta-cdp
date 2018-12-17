const {sequelize} = require('../services/db');
const Sequelize = require('sequelize');

const transactionSchema = {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ID',
    primaryKey: true
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
    field: 'USER_ID'
  },
  fromUserId: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'FROM_USER_ID'
  },
  amount: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'AMOUNT'
  },
  note: {
    type: Sequelize.DataTypes.TEXT,
    field: 'NOTE',
    defaultValue: ''
  },
  bCredit: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'B_CREDIT',
    defaultValue: 0
  },
  bMain1: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'B_MAIN_1',
    defaultValue: 0
  },
  bMain2: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'B_MAIN_2',
    defaultValue: 0
  },
  bPromo: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'B_PROMO',
    defaultValue: 0
  },
  aCredit: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'A_CREDIT',
    defaultValue: 0
  },
  aMain1: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'A_MAIN_1',
    defaultValue: 0
  },
  aMain2: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'A_MAIN_2',
    defaultValue: 0
  },
  aPromo: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'A_PROMO',
    defaultValue: 0
  }
};

const Transaction = sequelize.define('transaction', transactionSchema, {
  freezeTableName: true,
  tableName: 'USER'
});
module.exports = Transaction;