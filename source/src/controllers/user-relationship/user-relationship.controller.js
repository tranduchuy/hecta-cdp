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
const removeChildSchema = require('./validation-schemas/remove-child.schema');
const removeParentSchema = require('./validation-schemas/remove-parent.schema');

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
 *
 * @param res
 * @param {UserRelationShipModel} relation
 * @return {Promise<*>}
 * @private
 */
async function _handleAddRegisteredUserCaseExistsRelation(res, relation) {
  // if delete
  if (relation.delFlag === GlobalConstant.DelFlag.True) {
    relation.status = StatusConstant.ChildWaiting;
    relation.delFlag = GlobalConstant.DelFlag.False;
    await relation.save();
    logger.error(`${ctrlNm}::addRegisteredChild::success. Re-create relation ${relation.id} between user ${relation.parentId} and ${relation.childId}`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: [],
        entries: [{
          parentId: relation.parentId,
          childId: relation.childId,
          credit: relation.credit,
          usedCredit: relation.usedCredit
        }]
      }
    });
  }

  // if not delete
  // status = ACCEPTED
  if (relation.status === StatusConstant.ChildAccepted) {
    logger.error(`${ctrlNm}::addRegisteredChild::error. Exist active relation between user ${relation.parentId} and ${relation.childId}.`);

    return res.json({
      status: HttpCodeConstant.Error,
      messages: ['Exist active relation between you.'],
      data: {
        meta: {},
        entries: []
      }
    });
  }

  if (relation.status === StatusConstant.ChildWaiting) {
    logger.error(`${ctrlNm}::addRegisteredChild::error. Exist waiting relation between user ${relation.parentId} and ${relation.childId}.`);

    return res.json({
      status: HttpCodeConstant.Error,
      messages: ['Exist waiting relation between you.'],
      data: {
        meta: {},
        entries: []
      }
    });
  }

  if (relation.status === StatusConstant.ChildRejected) {
    relation.status = StatusConstant.ChildWaiting;
    await relation.save();
    logger.info(`${ctrlNm}::addRegisteredChild::success. Re-create relation ${relation.id} from REJECTED to WAITING between ${relation.parentId} and ${relation.childId}.`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{
          parentId: relation.parentId,
          childId: relation.childId,
          credit: relation.credit,
          usedCredit: relation.usedCredit
        }]
      }
    });
  }

  logger.error(`${ctrlNm}::addRegisteredChild::error. Duplicate relationship between user ${relation.parentId} and user ${relation.childId}`);
  return res.json({
    status: HttpCodeConstant.Error,
    messages: ['Duplicate relationship'],
    data: {meta: {}, entries: []}
  });
}

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
    const targetUser = await UserModel.findOne({
      where: {
        status: StatusConstant.Active,
        id: userId
      }
    });
    if (!targetUser) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. User not found`);
      return next('User not found');
    }

    if (targetUser.type !== UserTypeConstant.Personal) {
      logger.error(`${ctrlNm}::addRegisteredChild::error. Company can not be child of other company`);
      return next(`Invalid child. That child is a company`);
    }

    const relation = await URService.isExistRelation(req.user.id, userId);
    if (relation) {
      return await _handleAddRegisteredUserCaseExistsRelation(res, relation);
    }

    if (!await URService.isValidToBeChild(userId)) {
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
          id: newRelation.id,
          status: newRelation.status,
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
      logger.error(`${ctrlNm}::replyRequest::error. Not found by relation id: ${relationId}`);
      return next(new Error('Not found'));
    }

    if (relation.childId !== req.user.id) {
      logger.error(`${ctrlNm}::replyRequest::error. Permission denied`);
      return next(new Error('Permission denied'));
    }

    if (relation.status !== StatusConstant.ChildWaiting) {
      logger.error(`${ctrlNm}::replyRequest::error. Action is not permitted. User ${req.user.id} try to update relation status, but current status is not WAITING`);
      return next(new Error('Action is not permitted'));
    }

    relation.status = status;
    await relation.save();
    logger.info(`${ctrlNm}::replyRequest::success`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{
          id: relation.id,
          parentId: relation.parentId,
          childId: relation.childId,
          credit: relation.credit,
          usedCredit: relation.usedCredit
        }]
      }
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

    const {name, username, email, password, confirmedPassword, phone, gender, address, city, district, ward, birthday} = req.body;
    const duplicatedUsers = await UserModel.findAll({where: {email}});
    if (duplicatedUsers.length !== 0) {
      logger.error('UserController::register::error. Duplicate email');
      return next(new Error('Duplicate email'));
    }

    if (password !== confirmedPassword) {
      logger.error(`${ctrlNm}::addNewChild::error. 2 password not same`);
      return next(new Error('2 password not same'));
    }

    const newUserData = {
      email,
      password,
      name,
      username,
      city: city || null,
      district: district || null,
      ward: ward || null,
      phone: phone || null,
      address: address || null,
      gender: gender || null,
      birthday: null
    };

    if (birthday) {
      newUserData.birthday = new Date(birthday || '');
    }
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
          id: newRelation.id,
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
      where: {
        parentId: req.user.id,
        childId: req.query.childId,
        status: StatusConstant.ChildAccepted
      }
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
      },
      attributes: ['id', 'status', 'delFlag'],
      include: [
        {
          model: UserModel,
          as: 'parentInfo',
          attributes: ['id', 'name', 'username', 'email']
        }
      ]
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

/**
 *
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
const removeChild = async (req, res, next) => {
  logger.info(`UserController::removeChild::called`);

  try {
    const errors = AJV(removeChildSchema, req.query);
    if (errors.length !== 0) {
      return next(new Error(errors.join('\n')));
    }

    const childId = parseInt(req.query.childId);
    const child = await UserModel.findById(childId);
    if (!child) {
      logger.error(`${ctrlNm}::removeChild::error. Child not found. User id ${req.query.childId}`);
      return next(new Error('Account child not found'));
    }

    const relation = await URService.findRelationship(req.user.id, req.query.childId);
    if (!relation) {
      logger.error(`${ctrlNm}::removeChild::error. Relation is not exists. Parent ${req.user.id}, child ${req.query.childId}`);
      return next(new Error('Relation not exist.'));
    }

    const aParentBalance = await URService.doProcessGetBackParentMoney(req.user.id, req.query.childId, relation);
    relation.delFlag = GlobalConstant.DelFlag.True;
    await relation.save();
    logger.info(`${ctrlNm}::removeChild::success`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {balance: aParentBalance},
        entries: [relation]
      }
    });
  } catch (e) {
    logger.error(`UserController::removeChild::error`, e);
    return next(e);
  }
};

const removeParent = async (req, res, next) => {
  logger.info(`${ctrlNm}::removeParent::called`);

  try {
    const errors = AJV(removeParentSchema, req.query);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const parent = await UserModel.findById(req.query.parentId);
    if (!parent) {
      logger.error(`${ctrlNm}::removeParent::error. Parent account not found. Id ${req.query.parentId}`);
      return next(new Error('Parent not found'));
    }

    const relation = await URService.findRelationship(req.query.parentId, req.user.id);
    if (!relation) {
      logger.error(`${ctrlNm}::removeParent::error. Relation is not exist`);
      return next(new Error('Relation is not exists'));
    }

    await URService.doProcessGetBackParentMoney(req.query.parentId, req.user.id, relation);
    relation.delFlag = GlobalConstant.DelFlag.True;
    await relation.save();
    logger.info(`${ctrlNm}::removeParent::success`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: {}
      }
    });
  } catch (e) {
    logger.error(`${ctrlNm}::removeParent::error`, e);
    return next(e);
  }
};

module.exports = {
  addRegisteredChild,
  listChildren,
  replyRequest,
  addNewChild,
  getDetailChild,
  listRequest,
  removeChild,
  removeParent
};