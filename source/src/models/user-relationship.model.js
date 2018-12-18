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
    field: 'CREDIT'
  },
  status: {
    type: Sequelize.DataTypes.INTEGER,
    field: 'STATUS'
  },
  usedCredit: {
    type: Sequelize.DataTypes.BIGINT,
    field: 'USED_CREDIT'
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

const UserRelationShip = sequelize.define('userRelationShip', userRelationShipSchema, {
  freezeTableName: true,
  tableName: 'USER_RELATIONSHIP'
});
module.exports = UserRelationShip;