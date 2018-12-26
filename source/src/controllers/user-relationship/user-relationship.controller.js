const GlobalConstant = require('../../constants/global.constant');
const HttpCodeConstant = require('../../constants/http-code.constant');
const UserTypeConstant = require('../../constants/user-type.constant');
const StatusConstant = require('../../constants/status.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);
const URService = require('./user-relationship.service');
const UserService = require('../../controllers/user/user.service');
const RequestService = require('../../services/request.service');
const MailService = require('../../services/mailer.service');
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
const addNewChildSchema = require('./validation-schemas/add-new-child.schema');
const childDetailSchema = require('./validation-schemas/child-detail.schema');
const listRequestSchema = require('./validation-schemas/list-request.schema');

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
    if (req.user.type !== UserTypeConstant.Company) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. Permission denied, user type is not permitted`);
      return next(new Error('Permission denied, user type is not permitted'));
    }

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

    if (targetUser.type !== UserTypeConstant.Personal) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. Company can not be child of other company`);
      return next(`Invalid child. That child is a company`);
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

const addNewChild = async (req, res, next) => {
  logger.info(`${ctrlNm}::addNewChild:: called`);

  try {
    if (req.user.type !== UserTypeConstant.Company) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. Permission denied, user type is not permitted`);
      return next(new Error('Permission denied, user type is not permitted'));
    }

    const errors = AJV(addNewChildSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const {name, username, email, password, confirmedPassword, phone, gender, address} = req.body;
    if (password !== confirmedPassword) {
      logger.error(`${ctrlNm}::addNewChild::error. 2 password not same`);
      return next(new Error('2 password not same'));
    }

    const newUserData = {
      email: email,
      password: password,
      name: name,
      username: username,
      phone: phone || null,
      address: address || null,
      gender: gender || null
    };

    // create user, child should confirm email
    const newChild = await URService.registerNewChild(newUserData);
    // create user balance
    await UserService.createBalanceInfo(newChild.id);
    // Send email to confirm
    MailService.sendConfirmEmail(email, newChild.tokenEmailConfirm);

    // create relation
    let newRelation = await URService.createNewRelation(req.user.id, newChild.id);
    newRelation.status = StatusConstant.ChildAccepted;
    await newRelation.save();
    logger.info(`${ctrlNm}::addRegisteredChild::success. User ${newChild.id} become to be child of user ${req.user.id}`);

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
    logger.error(`${ctrlNm}::addNewChild::error`, e);
    return next(e);
  }
};

const getDetailChild = async (req, res, next) => {
  logger.info(`${ctrlNm}::getDetailChild::called`);

  try {
    const errors = AJV(childDetailSchema, req.query);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const child = await UserModel.findById(req.query.childId);
    if (!child) {
      logger.error(`${ctrlNm}::getDetailChild::error. Child not found`);
      return next(new Error('Child not found'));
    }

    const relation = await URModel.findOne({
      parentId: req.user.id,
      childId: req.query.childId,
      status: StatusConstant.ChildAccepted
    });

    if (!relation) {
      logger.error(`${ctrlNm}::getDetailChild::error. Permission denied`);
      return next(new Error('Permission denied'));
    }

    logger.info(`${ctrlNm}::getDetailChild::success. Get child info success. Child id ${req.query.childId}`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{
          id: child.id,
          username: child.username,
          email: child.email,
          name: child.name,
          phone: child.phone
        }]
      }
    });
  } catch (e) {
    logger.error(`${ctrlNm}::getDetailChild::error`, e);
    return next(e);
  }
};

const listRequest = async (req, res, next) => {
  logger.info(`${ctrlNm}::listRequest::called`);

  try {
    const errors = AJV(listRequestSchema, req.query);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    if (req.user.type === UserTypeConstant.Company) {
      logger.error(`${ctrlNm}::listRequest::error. Must be a personal account`);
      return next(new Error('You must be a personal account'));
    }

    const relations = await URModel.findAll({
      where: {
        childId: req.user.id
      }
    });
    logger.info(`${ctrlNm}::listRequest::success`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: relations
      }
    });
  } catch (e) {
    logger.error(`${ctrlNm}::listRequest::error`, e);
    return next(e);
  }
};

module.exports = {
  addRegisteredChild,
  listChildren,
  replyRequest,
  addNewChild,
  getDetailChild,
  listRequest
};