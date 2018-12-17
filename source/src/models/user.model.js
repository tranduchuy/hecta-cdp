const {sequelize} = require('../services/db');
const Sequelize = require('sequelize');
const UserTypeConstant = require('../constants/user-type.constant');
const UserRoleConstant = require('../constants/user-role.constant');
const StatusConstant = require('../constants/status.constant');

const userSchema = {
  id: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ID',
    primaryKey: true,
    autoIncrement: true
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
    field: 'CREATED_AT',
    defaultValue: Sequelize.DataTypes.NOW
  },
  updatedAt: {
    type: Sequelize.DataTypes.DATE,
    field: 'UPDATED_AT',
    defaultValue: Sequelize.DataTypes.NOW
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
    field: 'PHONE',
    defaultValue: ''
  },
  gender: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'GENDER'
  },
  age: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'AGE'
  },
  role: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'ROLE',
    defaultValue: UserRoleConstant.EndUser
  },
  city: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'CITY'
  },
  district: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'DISTRICT'
  },
  avatar: {
    type: Sequelize.DataTypes.TEXT,
    field: 'AVATAR'
  },
  birthday: {
    type: Sequelize.DataTypes.DATE,
    field: 'BIRTHDAY'
  },
  type: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'TYPE',
    defaultValue: UserTypeConstant.Personal
  },
  status: {
    type: Sequelize.DataTypes.ENUM,
    values: [
      StatusConstant.Active,
      StatusConstant.PendingOrWaitConfirm,
      StatusConstant.Blocked,
      StatusConstant.Delete
    ],
    defaultValue: StatusConstant.PendingOrWaitConfirm
  }
};

const User = sequelize.define('user', userSchema, {
  freezeTableName: true,
  tableName: 'USER'
});
module.exports = User;