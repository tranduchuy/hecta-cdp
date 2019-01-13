const UserService = require('./user.service');
/**
 * @type {UserModel}
 */
const UserModel = require('../../models/user.model');
/**
 * @type Model
 */
const URModel = require('../../models/user-relationship.model');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const bcrypt = require('bcrypt');
const logger = log4js.getLogger('Controllers');
const AJV = require('../../core/ajv');
const MailService = require('../../services/mailer.service');
const Sequelize = require('sequelize');

// constants
const StatusConstant = require('../../constants/status.constant');
const UserRoleConstant = require('../../constants/user-role.constant');
const UserTypeConstant = require('../../constants/user-type.constant');
const TransactionTypeConstant = require('../../constants/transaction-type.constant');

// validate schema
const loginSchema = require('./validation-schemas/login.schema');
const registerSchema = require('./validation-schemas/register.schema');
const confirmEmailSchema = require('./validation-schemas/confirm-email.schema');
const updateInfoSchema = require('./validation-schemas/update-info.schema');
const resendConfirmEmailSchema = require('./validation-schemas/resend-confirm-email.schema');
const forgetPasswordSchema = require('./validation-schemas/forget-password.schema');
const resetPasswordSchema = require('./validation-schemas/reset-password.schema');
const findDetailByEmailSchema = require('./validation-schemas/find-detail-by-email.schema');
const shareBalanceSchema = require('./validation-schemas/share-balance.schema');
const updateBalanceSchema = require('./validation-schemas/update-balance.schema');
const updateBalanceSaleCostSchema = require('./validation-schemas/update-balance-by-sale-cost.schema');

/**
 *
 * @param req {body: {email, password}}
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const login = async (req, res, next) => {
  logger.info('UserController::login::called');

  try {
    const errors = AJV(loginSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {}
      });
    }

    const {email, username, password} = req.body;
    const user = await UserService.findByEmailOrUsername(email, username);
    if (!user) {
      logger.warn('UserController::login::warn. User not found');
      return next(new Error('User not found'));
    }

    if (!UserService.isValidHashPassword(user.passwordHash, password)) {
      logger.error(`UserController::login::error. Wrong password. Try input password "${password}" for user "${user.id}"`);
      return next(new Error('Wrong password'));
    }

    if (user.status !== StatusConstant.Active) {
      logger.error(`UserController::login::error. Inactive user is try to log in. User: ${user.id}`);
      return next(new Error('User inactive'));
    }

    const userInfoResponse = {
      id: user.id,
      role: user.role,
      email: user.email,
      username: user.username,
      name: user.name,
      phone: user.phone,
      address: user.address,
      type: user.type,
      status: user.status,
      balance: await UserService.getBalanceInfo(user.id)
    };
    const token = UserService.generateToken({email: user.email});
    logger.info(`UserController::login::success. User ${user.email} logged in`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Successfully'],
      data: {
        meta: {
          token
        },
        entries: [userInfoResponse]
      }
    });
  } catch (e) {
    logger.error('UserController::login::error', e);
    return next(e);
  }
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const register = async (req, res, next) => {
  logger.info('UserController::login::called');

  try {
    const errors = AJV(registerSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const {email, password, confirmedPassword, name, username, phone} = req.body;
    if (password !== confirmedPassword) {
      logger.error('UserController::register::error. 2 passwords not same');
      return next(new Error('2 passwords not same'));
    }

    const duplicatedUsers = await UserModel.findAll({where: {email}});
    if (duplicatedUsers.length !== 0) {
      logger.error('UserController::register::error. Duplicate email');
      return next(new Error('Duplicate email'));
    }

    const newUser = await UserService.createUser(req.body);
    await UserService.createBalanceInfo(newUser.id);

    // nếu là admin tạo thì ko cần gửi email, và mặc định là active sẵn
    if (req.user && [UserRoleConstant.Master, UserRoleConstant.Admin].some(req.user.role)) {
      newUser.status = StatusConstant.Active;
      newUser.tokenEmailConfirm = '';
      await newUser.save();
    } else {
      // Send email
      MailService.sendConfirmEmail(email, newUser.tokenEmailConfirm);
    }

    logger.info(`UserController::register::success. Email: ${email}`);
    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{email, name, username, phone}]
      }
    });
  } catch (e) {
    logger.error('UserController::login::error', e);
    return next(e);
  }
};

/**
 * Confirm token in email after registering. Will update status ACTIVE and
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const confirmRegister = async (req, res, next) => {
  try {
    const {token} = req.query;
    logger.info(`UserController::confirmRegister::called. Token request: ${token}`);

    const schemaErrors = AJV(confirmEmailSchema, req.query);
    if (schemaErrors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: schemaErrors,
        data: {}
      });
    }

    const user = await UserModel.findOne({
      where: {
        tokenEmailConfirm: token
      }
    });

    if (!user) {
      logger.warn('UserController::confirmRegister::warning. Try to active user.');
      return next(new Error('Invalid token'));
    }

    await user.update({
      status: StatusConstant.Active,
      tokenEmailConfirm: ''
    });

    logger.info(`UserController::confirmRegister::success. User ${user.email || user.id} confirm email success`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: []
      }
    });
  } catch (e) {
    logger.error('UserController::confirmRegister::error', e);
    return next(e);
  }
};

/**
 * Get info of user who is logging in
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const getInfoLoggedIn = async (req, res, next) => {
  logger.info('UserController::getInfoLoggedIn::called');

  try {
    const userInfoResponse = {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
      username: req.user.username,
      name: req.user.name,
      phone: req.user.phone,
      address: req.user.address,
      balance: await UserService.getBalanceInfo(req.user.id)
    };

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [userInfoResponse]
      }
    });
  } catch (e) {
    logger.error('UserController::getInfoLoggedIn::error', e);
    return next(e);
  }
};

/**
 * Update info of user
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const updateInfo = async (req, res, next) => {
  logger.info('UserController::updateInfo::called');

  try {
    const errors = AJV(updateInfoSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const {name, gender, phone, address, password, oldPassword, confirmedPassword, status, type} = req.body;
    const {id} = req.params;
    const isAdmin = [UserRoleConstant.Admin, UserRoleConstant.Master].some(r => r === req.user.role);
    if (isAdmin === false && req.user.id != id) {
      logger.error(`UserController::updateInfo::error. User ${req.user.id} try to update info of user ${id}, but he's not ADMIN`);
      return next(new Error('Permission denied'));
    }

    // only admin or master can update status of user
    if (!isAdmin && status !== undefined) {
      logger.error('UserController::updateInfo::error. Permission denied');
      return next(new Error('Permission denied'));
    }

    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      logger.error(`UserController::updateInfo::error. User not found. Find by id: ${id}`);
      return next(new Error('User not found'));
    }

    if (type) {
      const errors = await UserService.isValidUpdateType(targetUser);
      if (errors.length !== 0) {
        logger.error('UserController::updateInfo::error', errors.join('\n'));

        return res.json({
          status: HttpCodeConstant.Error,
          messages: errors,
          data: {meta: {},entries: []}
        });
      }
    }

    if (password) {
      if (password !== confirmedPassword) {
        return next(new Error('Two password not same'));
      } else if (!bcrypt.compareSync(oldPassword, targetUser.passwordHash)) {
        return next(new Error('Wrong old password'));
      }
    }

    targetUser.name = name || targetUser.name;
    targetUser.address = address || targetUser.address;
    targetUser.phone = phone || targetUser.phone;
    targetUser.gender = gender || targetUser.gender;
    targetUser.passwordHash = password ? bcrypt.hashSync(password, targetUser.passwordSalt) : targetUser.passwordHash;
    targetUser.type = type || targetUser.type;
    targetUser.status = isAdmin ? status : targetUser.status;
    await targetUser.save();
    logger.info('UserController::updateInfo::success');

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{
          email: targetUser.email,
          name: targetUser.name,
          username: targetUser.username,
          phone: targetUser.phone,
          address: targetUser.address,
          gender: targetUser.gender,
          type: targetUser.type
        }]
      }
    });
  } catch (e) {
    logger.error('UserController::updateInfo::error', e);
    return next(e);
  }
};

/**
 * Check duplicate username or email
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const checkDuplicateEmailOrUsername = async (req, res, next) => {
  logger.info('UserController::checkDuplicateEmailOrUsername::called');

  try {
    const {username, email} = req.query;

    if (username) {
      const user = await UserService.findByEmailOrUsername('___', username);
      if (user) {
        return res.json({
          status: HttpCodeConstant.Success,
          messages: ['Duplicate username'],
          data: {
            meta: {
              isDuplicate: true
            },
            entries: []
          }
        })
      } else {
        return res.json({
          status: HttpCodeConstant.Success,
          messages: ['Valid username'],
          data: {
            meta: {
              isDuplicate: false
            },
            entries: []
          }
        });
      }
    } else if (email) {
      const user = await UserService.findByEmailOrUsername(email, '___');
      if (user) {
        return res.json({
          status: HttpCodeConstant.Success,
          messages: ['Duplicate email'],
          data: {
            meta: {
              isDuplicate: true
            },
            entries: []
          }
        });
      } else {
        return res.json({
          status: HttpCodeConstant.Success,
          messages: ['Valid email'],
          data: {
            meta: {
              isDuplicate: false
            },
            entries: []
          }
        });
      }
    }

    logger.error('UserController::checkDuplicateEmailOrUsername::error. Nothing to check');

    return next(new Error('Nothing to check duplicate'));
  } catch (e) {
    logger.error('UserController::checkDuplicateEmailOrUsername::error', e);
    return next(e);
  }
};

/**
 * Api resend email for confirm new user
 * @param {object} req
 * @param {object} res
 * @param next
 * @returns {Promise<*>}
 */
const resendConfirmRegister = async (req, res, next) => {
  logger.info('UserController::resendConfirmRegister::called');

  try {
    const errors = AJV(resendConfirmEmailSchema, req.query);
    if (errors.length !== 0) {
      logger.error('UserControllers::resendConfirmRegister::error. Wrong email');
      return next(new Error('Wrong email'));
    }

    const {email} = req.query;
    const user = UserService.findByEmailOrUsername(email, '___');
    if (!user) {
      logger.error(`UserController::resendConfirmRegister::error. User not found. Try to get user by email ${email}`);
      return next(new Error('User not found'));
    }

    if (user.status !== StatusConstant.PendingOrWaitConfirm) {
      logger.error('UserController::resendConfirmRegister::error. User have already been active');
      return next(new Error('User have already been active'));
    }

    // Send email
    MailService.sendConfirmEmail(email, user.tokenEmailConfirm);
    logger.info('UserController::resendConfirmRegister::success');

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {meta: {}, entries: []}
    });
  } catch (e) {
    logger.error('UserController:;resendConfirmRegister::error', e);
    return next(e);
  }
};

/**
 * Api forget password. Will lock user and send an email for resetting password
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const forgetPassword = async (req, res, next) => {
  logger.info('UserController::forgetPassword::called');

  try {
    const errors = AJV(forgetPasswordSchema, req.query);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const user = await UserModel.findOne({
      where: {
        email: req.query.email,
        status: StatusConstant.Active
      }
    });

    if (!user) {
      logger.error(`UserController::forgetPassword::error. User not found, find by email: ${req.query.email}, status ACTIVE`);
      return next(new Error('User not found'));
    }

    await UserService.blockUserForgetPassword(user);
    await MailService.sendResetPassword(user.email, user.passwordReminderToken);
    logger.info('UserController::forgetPassword::success');

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {meta: {}, entries: []}
    });
  } catch (e) {
    logger.error('UserController::forgetPassword::error', e);
    return next(e);
  }
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const resetPassword = async (req, res, next) => {
  logger.info('UserController::resetPassword::called');

  try {
    const errors = AJV(resetPasswordSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {
          meta: {},
          entries: []
        }
      });
    }

    const {token, password, confirmedPassword} = req.body;
    if (password !== confirmedPassword) {
      logger.error('UserController::resetPassword::error. 2 passwords not same');
      return next(new Error('2 passwords not same'));
    }

    const user = await UserModel.findOne({
      where: {
        passwordReminderToken: token
      }
    });

    if (!user) {
      logger.warn('UserController::resetPassword::warn. User not found');
      return next(new Error('User not found'));
    }

    if (UserService.isExpiredTokenResetPassword(user.passwordReminderExpire)) {
      logger.error(`UserController::resetPassword::error. Time's up. Please try forget password again`);
      return next(new Error(`Time's up. Please try forget form again`));
    }

    user.passwordHash = bcrypt.hashSync(password, user.passwordSalt);
    user.passwordReminderToken = '';
    await user.save();

    logger.info('UserController::resetPassword::success');
    return res.json({
      status: HttpCodeConstant.Success,
      messages: [],
      data: {meta: {}, entries: []}
    })
  } catch (e) {
    logger.error('UserController::resetPassword::error', e);
    return next(e);
  }
};

const findDetailByEmail = async (req, res, next) => {
  logger.info('UserController::findDetailByEmail::called');
  try {
    const errors = AJV(findDetailByEmailSchema, req.query);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    logger.info(`UserController::findDetailByEmail::called with email ${req.query.email}`);
    const user = await UserModel.findOne({
      where: {
        email: req.query.email,
        status: StatusConstant.Active,
        role: {
          [Sequelize.Op.notIn]: [UserRoleConstant.Admin, UserRoleConstant.Master]
        }
      }
    });

    if (!user) {
      logger.error(`UserController::findDetailByEmail::error. User not found. Email: ${req.query.email}`);
      return next(new Error('User not found'));
    }

    logger.info('UserController::findDetailByEmail::success');
    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{
          role: user.role,
          email: user.email,
          name: user.name || '',
          username: user.username,
          phone: user.phone,
          address: user.address,
          gender: user.gender
        }]
      }
    });
  } catch (e) {
    logger.error('UserController::findDetailByEmail::error', e);
    return next(e);
  }
};

/**
 * Get highlight list user
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @return {Promise<*>}
 */
const getHighlightUser = async (req, res, next) => {
  logger.info('UserController::getHighlightUser::called');

  try {
    const users = await UserModel.findAll({
      where: {
        avatar: {
          [Sequelize.Op.notIn]: [null, '']
        },
        role: {
          [Sequelize.Op.notIn]: [UserRoleConstant.Master, UserRoleConstant.Admin]
        }
      },
      limit: 10
    });
    const resultUsers = users.map(u => {
      return {
        email: u.email,
        username: u.username,
        name: u.name,
        avatar: u.avatar,
        phone: u.phone,
        gender: u.gender
      }
    });

    logger.info(`UserController::getHighlightUser::success. Get ${resultUsers.length} highlight user`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {
          size: 10
        },
        entries: resultUsers
      }
    });
  } catch (e) {
    logger.error('UserController::getHighlightUser::error', e);
    return next(e);
  }
};

/**
 * Share balance from parent account to child account. The amount will be subtracted from parent's MAIN_1 and added into child's CREDIT
 * @param req
 * @param res
 * @param next
 * @return {Promise<*>}
 */
const shareBalanceToChild = async (req, res, next) => {
  // TODO should include checking google authenticate
  logger.info(`UserController::shareBalanceToChild::called`);

  try {
    const errors = AJV(shareBalanceSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    // Check type company for sharing
    if (req.user.type !== UserTypeConstant.Company) {
      logger.error(`UserController::shareBalanceToChild::error. Need account company(${UserTypeConstant.Company}). Current ${req.user.type}`);
      return next(new Error('Must be a company'));
    }

    const {childId, amount} = req.body;
    const parentBalanceInfo = await UserService.getBalanceInfo(req.user.id);

    // Check how much main1
    if (parentBalanceInfo.main1 < amount) {
      logger.error(`UserController::shareBalance::error. MAIN_1 is not enough for share. Parent balance: `, JSON.stringify(parentBalanceInfo));
      return next(new Error('Not enough money for share'));
    }

    const child = await UserModel.findById(childId);
    if (!child) {
      logger.error(`UserController::shareBalance::error. Child account not found. Find by id ${childId}`);
      return next(new Error('Child account not found'));
    }

    // Check personal account for other parent can be shared credit
    if (child.type !== UserTypeConstant.Personal) {
      logger.error(`UserController::shareBalanceToChild::error. Need account is child(${UserTypeConstant.Personal}) for sharing credit. Current ${child.type}`);
      return next(new Error(`You're not personal account`));
    }

    // Check relation between parent and child
    const relation = await URModel.findOne({
      where: {
        parentId: req.user.id,
        childId: childId,
        status: StatusConstant.ChildAccepted
      }
    });

    if (!relation) {
      logger.error(`UserController::shareBalanceToChild::error. Relation is not exist between ${req.user.id}, ${childId} with status ${StatusConstant.ChildAccepted}`);
      return next(new Error('You and that account have no real relation ship'));
    }

    const childBalanceInfo = await UserService.getBalanceInfo(childId);
    const afterParentBalance = await UserService.updateMain1(req.user.id, -amount);
    logger.info(`UserController::shareBalanceToChild::updateMain1::success. Update success for parent ${req.user.id}. From ${JSON.stringify(parentBalanceInfo)} to ${JSON.stringify(afterParentBalance)}`);

    // NOT update child's main1. Just update relation.credit
    relation.credit = (relation.credit || 0) + amount;
    await relation.save();
    logger.info(`UserController::shareBalanceToChild::updateMain1::success. Update relation credit success`);

    const t1 = await UserService.addTransactionForParentShareCredit(req.user.id, childId, amount, parentBalanceInfo, afterParentBalance);
    logger.info(`UserController::shareBalanceToChild::create transaction for parent success. `, JSON.stringify(t1));

    const afterChildBalance = Object.assign({}, childBalanceInfo, {credit: relation.credit});
    const t2 = await UserService.addTransactionForChildReceiveCredit(req.user.id, childId, amount, childBalanceInfo, afterChildBalance);
    logger.info(`UserController::shareBalanceToChild::create transaction for child success. `, JSON.stringify(t2));

    logger.info(`UserController::shareBalanceToChild::success. From ${req.user.id} to ${childId} with amount ${amount}`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [{
          parentBalance: afterParentBalance,
          childBalance: afterChildBalance
        }]
      }
    });
  } catch (e) {
    logger.error(`UserController::shareBalanceToChild::error`);
    return next(e);
  }
};

/**
 *
 * @param req
 * @param res
 * @param next
 * @return {Promise<void>}
 */
const updateBalance = async (req, res, next) => {
  logger.info('UserController::updateBalance::called');

  try {
    const errors = AJV(updateBalanceSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    if (![UserRoleConstant.Master, UserRoleConstant.Admin].some(r => r === req.user.role)) {
      return next(new Error('Permission denied'));
    }

    const {main1, main2, promo, userId} = req.body;
    const balanceInstance = await UserService.getBalanceInstance(userId);
    let bBalanceInfo = await UserService.getBalanceInfo(userId);
    let aBalanceInfo = {...bBalanceInfo};

    // update main 1
    if (main1) {
      aBalanceInfo.main1 = bBalanceInfo.main1 + main1;
      const t = await UserService.addTransactionUpdateBalance({
        parentId: req.user.id,
        userId,
        amount: main1,
        before: bBalanceInfo,
        after: aBalanceInfo,
        type: TransactionTypeConstant.AddMain
      });

      logger.info(`UserController::updateBalance::create transaction updating balance main1 TRANSACTION_ID ${t.id}`);
    }

    // update main 2
    if (main2) {
      bBalanceInfo = {...aBalanceInfo};
      aBalanceInfo.main2 = aBalanceInfo.main2 + main2;
      const t = await UserService.addTransactionUpdateBalance({
        parentId: req.user.id,
        userId,
        amount: main2,
        before: bBalanceInfo,
        after: aBalanceInfo,
        type: TransactionTypeConstant.AddMain
      });

      logger.info(`UserController::updateBalance::create transaction updating balance main2 TRANSACTION_ID ${t.id}`);
    }

    // update main2
    if (promo) {
      bBalanceInfo = {...aBalanceInfo};
      aBalanceInfo.promo = aBalanceInfo.promo + promo;
      const t = await UserService.addTransactionUpdateBalance({
        parentId: req.user.id,
        userId,
        amount: promo,
        before: bBalanceInfo,
        after: aBalanceInfo,
        type: TransactionTypeConstant.AddPromo
      });

      logger.info(`UserController::updateBalance::create transaction updating balance promo TRANSACTION_ID ${t.id}`);
    }

    balanceInstance.main1 = aBalanceInfo.main1;
    balanceInstance.main2 = aBalanceInfo.main2;
    balanceInstance.promo = aBalanceInfo.promo;
    await balanceInstance.save();
    logger.info(`UserController::updateBalance::success. Update balance of ${userId} success.`);

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: [aBalanceInfo]
      }
    });
  } catch (e) {
    logger.error(`UserController::updateBalance::error`, e);
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
const updateBalanceSaleCost = async (req, res, next) => {
  logger.info(`UserController::updateBalanceSaleCost::called`);
  // TODO: note property should include sale_id (mongo id)

  try {
    const errors = AJV(updateBalanceSaleCostSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const {cost, note} = req.body;
    UserService.updateBalanceWhenBuyingSomething(req.user.id, cost, note, 'SALE')
      .then(() => {
        return res.json({
          status: HttpCodeConstant.Success,
          messages: ['Success'],
          data: {meta: {}, entries: []}
        });
      })
      .catch(err => {
        logger.error(`UserController::updateBalanceSaleCost::error`, err);
        return next(err);
      });

  } catch (e) {
    logger.error(`UserController::updateBalanceSaleCost::error`, e);
    return next(e);
  }
};

const updateBalanceUpNewsCost = async (req, res, next) => {
  logger.info(`UserController::updateBalanceUpNewsCost::called`);
  // TODO: note property should include sale_id (mongo id)

  try {
    // using same schema with function updateBalanceSaleCost
    const errors = AJV(updateBalanceSaleCostSchema, req.body);
    if (errors.length !== 0) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: errors,
        data: {meta: {}, entries: []}
      });
    }

    const {cost, note} = req.body;
    UserService.updateBalanceWhenBuyingSomething(req.user.id, cost, note, 'UP_NEWS')
      .then(() => {
        return res.json({
          status: HttpCodeConstant.Success,
          messages: ['Success'],
          data: {meta: {}, entries: []}
        });
      })
      .catch(err => {
        logger.error(`UserController::updateBalanceUpNewsCost::error`, err);
        return next(err);
      });
  } catch (e) {
    logger.error(`UserController::updateBalanceUpNewsCost::error`, e);
    return next(e);
  }
};

const checkValidToken = (req, res, next) => {
  return res.json({
    status: HttpCodeConstant.Success,
    messages: [],
    data: {
      meta: {},
      entries: []
    }
  });
};

module.exports = {
  login,
  register,
  confirmRegister,
  getInfoLoggedIn,
  updateInfo,
  checkDuplicateEmailOrUsername,
  checkValidToken,
  resendConfirmRegister,
  forgetPassword,
  resetPassword,
  findDetailByEmail,
  getHighlightUser,
  shareBalanceToChild,
  updateBalance,
  updateBalanceSaleCost,
  updateBalanceUpNewsCost
};