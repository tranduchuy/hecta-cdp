const UserService = require('./user.service');
const UserModel = require('../../models/user.model');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const bcrypt = require('bcrypt');
const logger = log4js.getLogger('Controllers');
const AJV = require('../../core/ajv');
const MailService = require('../../services/mailer.service');

// constants
const StatusConstant = require('../../constants/status.constant');
const UserRoleConstant = require('../../constants/user-role.constant');

// validate schema
const loginSchema = require('./validation-schemas/login.schema');
const registerSchema = require('./validation-schemas/register.schema');
const confirmEmailSchema = require('./validation-schemas/confirm-email.schema');
const updateInfoSchema = require('./validation-schemas/update-info.schema');
const resendConfirmEmailSchema = require('./validation-schemas/resend-confirm-email.schema');
const forgetPasswordSchema = require('./validation-schemas/forget-password.schema');
const resetPasswordSchema = require('./validation-schemas/reset-password.schema');

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
      email: user.email,
      username: user.username,
      name: user.name,
      phone: user.phone,
      address: user.address,
      type: user.type,
      balance: await UserService.getBalanceInfo(user.id)
    };
    const token = UserService.generateToken(userInfoResponse);
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
        data: {}
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
    // Send email
    MailService.sendConfirmEmail(email, newUser.tokenEmailConfirm);

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
    logger.info(`UsergetBalanceInfoController::confirmRegister::called. Token request: ${token}`);

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
  // TODO: should be test
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

    // only admin or master can update status of user
    const availableToUpdateStatus = [UserRoleConstant.Admin, UserRoleConstant.Master].some(r => r === req.user.role);
    if (!availableToUpdateStatus) {
      logger.error('UserController::updateInfo::error. Permission denied');
      return next(new Error('Permission denied'));
    }

    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      logger.error(`UserController::updateInfo::error. User not found. Find by id: ${id}`);
      return next(new Error('User not found'));
    }

    if (type) {
      const errors = UserService.isValidUpdateType(targetUser);
      if (errors.length !== 0) {
        logger.error('UserController::updateInfo::error', errors.join('\n'));

        return res.json({
          status: HttpCodeConstant.Error,
          messages: errors,
          data: {
            meta: {},
            entries: []
          }
        });
      }
    }

    if (password) {
      if (password !== confirmedPassword) {
        return next(new Error('Two password not same'));
      } else if (!bcrypt.compareSync(oldPassword, targetUser.password)) {
        return next(new Error('Wrong old password'));
      }
    }

    const dataToUpdate = {
      name: name || targetUser.user,
      address: address || targetUser.address,
      phone: phone || targetUser.phone,
      gender: gender || targetUser.gender,
      password: password ? bcrypt.hashSync(password, targetUser.passwordSalt) : targetUser.passwordHash,
      type: type || targetUser.type,
      status: availableToUpdateStatus ? status : targetUser.status
    };

    await UserModel.update(dataToUpdate);
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
      logger.error(`UserController::forgetPassword::error. User not found, find by email: ${req.query.email}`);
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
      logger.error('UserController::register::error. 2 passwords not same');
      return next(new Error('2 passwords not same'));
    }

    const user = await UserModel.findOne({
      passwordReminderToken: token
    });

    if (!user) {
      logger.warn('UserController::login::warn. User not found');
      return next(new Error('User not found'));
    }

    if (UserService.isExpiredTokenResetPassword(user.passwordReminderExpire)) {
      logger.error(`UserController::login::error. Time's up. Please try forget password again`);
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

module.exports = {
  login,
  register,
  confirmRegister,
  getInfoLoggedIn,
  updateInfo,
  checkDuplicateEmailOrUsername,
  resendConfirmRegister,
  forgetPassword,
  resetPassword
};