const GlobalConstant = require('../../constants/global.constant');
const StatusConstant = require('../../constants/status.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);

// models
/**
 * @type UserRelationShipModel
 */
const UserRelationshipModel = require('../../models/user-relationship.model');

const getListChildren = async (userId) => {

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

module.exports = {
  isValidToBeChild,
  isExistRelation,
  createNewRelation
};