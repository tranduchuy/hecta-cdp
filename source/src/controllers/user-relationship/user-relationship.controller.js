const GlobalConstant = require('../../constants/global.constant');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);
const URService = require('./user-relationship.service');
const RequestService = require('../../services/request.service');
const AJV = require('../../core/ajv');
const ctrlNm = 'UserRelationshipController';

// models
/**
 * @type UserModel
 */
const UserModel = require('../../models/user.model');
/**
 * @type UserRelationShipModel
 */
const URModel = require('../../models/user-relationship.model');

// schemas
const addRegisteredChildSchema = require('./validation-schemas/add-registered-child.schema');
const getListChildrenSchema = require('./validation-schemas/list-children.schema');
const replyRequestRelationSchema = require('./validation-schemas/reply-request.schema');

/**
 * Api get list children of logged in user
 * @param {Object} req
 * @param {Object} res
 * @param {Function }next
 * @return {Promise<*>}
 */
const listChildren = async (req, res, next) => {
  logger.info(`${ctrlNm}::listChildren::called`);
  try {
    const errors = AJV(getListChildrenSchema, req.query);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const paginationOptions = RequestService.extractPaginationCondition(req);
    const optionQuery = Object.assign({}, paginationOptions, URService.mapQueryToValidObjectSort(req.query));
    const result = await URService.getListChildren(req.user.id, optionQuery);
    logger.info(`${ctrlNm}::listChildren::success`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {
          totalRecords: result.count,
          limit: optionQuery.limit,
          currentPage: optionQuery.page
        },
        entries: result.rows
      }
    });
  } catch (e) {
    logger.error(`${ctrlNm}::listChildren::error`, e);
    return next(e);
  }
};

/**
 * Api add an user to be own child
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @return {Promise<*>}
 */
const addRegisteredChild = async (req, res, next) => {
  logger.info(`${ctrlNm}::addRegisteredChild::called`);

  try {
    const errors = AJV(addRegisteredChildSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages:errors,
        data: {
          meta: {},
          entries: []
        }
      });
    }

    const {userId} = req.body;
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. User not found`);
      return next('User not found');
    }

    const isExistRelation = await URService.isExistRelation(req.user.id, userId);
    if (isExistRelation) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. Duplicate relationship between user ${req.user.id} and user ${userId}`);
      return next(new Error('Duplicate relationship'));
    }

    if (!URService.isValidToBeChild(userId)) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. Invalid target user. This user is a child of someone or is a parent of children.`);
      return next(new Error('Invalid target user. This user is a child of someone or is a parent of children.'));
    }

    const newRelation = await URService.createNewRelation(req.user.id, userId);
    logger.info(`${ctrlNm}::addRegisteredChild::success. User ${userId} become to be child of user ${req.user.id}`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{
          parentId: newRelation.parentId,
          childId: newRelation.childId,
          credit: newRelation.credit,
          usedCredit: newRelation.usedCredit
        }]
      }
    });
  } catch (e) {
    logger.error(`${ctrlNm}::addRegisteredChild::error`, e);
    return next(e);
  }
};

/**
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @return {Promise<*>}
 */
const replyRequest = async (req, res, next) => {
  logger.info(`${ctrlNm}::replyRequest::called`);

  try {
    const errors = AJV(replyRequestRelationSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const {status, relationId} = req.body;
    const relation = await URModel.findById(relationId);
    if (!relation) {
      logger.error(`${ctrlNm}::replyRequest::error. Not found by id: ${relationId}`);
      return next(new Error('Not found'));
    }

    if (relation.childId !== req.user.id) {
      logger.error(`${ctrlNm}::replyRequest::error. Permission denied`);
      return next(new Error('Permission denied'));
    }

    relation.status = status;
    await relation.save();
    logger.info(`${ctrlNm}::replyRequest::success`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {meta: {}, entries: [relation]}
    });
  } catch (e) {
    logger.error(`${ctrlNm}::replyRequest::error`, e);
    return next(e);
  }
};

module.exports = {
  addRegisteredChild,
  listChildren,
  replyRequest
};