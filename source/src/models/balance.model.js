const {sequelize} = require('../services/db');
const Sequelize = require('sequelize');

const balanceSchema = {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ID',
    primaryKey: true
  },
  main1: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'MAIN_1',
    defaultValue: 0
  },
  main2: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'MAIN_2',
    defaultValue: 0
  },
  promo: {
    type: Sequelize.DataTypes.DECIMAL(20, 0),
    field: 'PROMO',
    defaultValue: 0
  },
  createdAt: {
    type: Sequelize.DataTypes.DATE,
    field: 'UPDATED_AT',
    defaultValue: Sequelize.DataTypes.NOW
  },
  updatedAt: {
    type: Sequelize.DataTypes.DATE,
    field: 'UPDATED_AT',
    defaultValue: Sequelize.DataTypes.NOW
  },
  userId: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'USER_ID'
  }
};

const Balance = sequelize.define('user', balanceSchema, {
  freezeTableName: true,
  tableName: 'BALANCE'
});
module.exports = Balance;