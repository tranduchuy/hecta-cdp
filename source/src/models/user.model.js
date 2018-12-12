const {sequelize} = require('../services/db');
const Sequelize = require('sequelize');

const userSchema = {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ID',
    primaryKey: true
  },
  subId: {
    type: Sequelize.DataTypes.STRING(60),
    field: 'SUB_ID',
  },
  email: {
    type: Sequelize.DataTypes.STRING(100),
    field: 'EMAIL'
  },
  username: {
    type: Sequelize.DataTypes.STRING(30),
    field: 'USER_NAME'
  },
  name: {
    type: Sequelize.DataTypes.STRING,
    field: 'NAME'
  },
  createdAt: {
    type: Sequelize.DataTypes.DATE,
    field: 'CREATED_AT'
  },
  updatedAt: {
    type: Sequelize.DataTypes.DATE,
    field: 'UPDATED_AT'
  },
  passwordHash: {
    type: Sequelize.DataTypes.STRING(200),
    field: 'PASSWORD_HASH'
  },
  passwordSalt: {
    type: Sequelize.DataTypes.STRING(100),
    field: 'PASSWORD_SALT'
  },
  tokenEmailConfirm: {
    type: Sequelize.DataTypes.STRING(50),
    field: 'TOKEN_EMAIL_CONFIRM'
  },
  passwordReminderToken: {
    type: Sequelize.DataTypes.STRING(50),
    field: 'PASSWORD_REMINDER_TOKEN'
  },
  passwordReminderExpire: {
    type: Sequelize.DataTypes.DATE,
    field: 'PASSWORD_REMINDER_EXPIRE'
  },
  address: {
    type: Sequelize.DataTypes.STRING(100),
    field: 'ADDRESS'
  },
  phone: {
    type: Sequelize.DataTypes.STRING(11),
    field: 'PHONE'
  },
  gender: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'GENDER'
  },
  age: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'AGE'
  }
};

const User = sequelize.define('user', userSchema, {
  freezeTableName: true,
  tableName: 'USER'
});
module.exports = User;