const UserService = require('./user.service');
const UserModel = require('../../models/user.model');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const AJV = require('../../core/ajv');

// constants
const StatusConstant = require('../../constants/status.constant');

// validate schema
const loginSchema = require('./validation-schemas/login.schema');
const registerSchema = require('./validation-schemas/register.schema');
const confirmEmailSchema = require('./validation-schemas/confirm-email.schema');

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
const confirmRegister = async(req, res, next) => {
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

    logger.error(`UserController::confirmRegister::success. User ${user.email || user.id} confirm email success`);

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

module.exports = {
  login,
  register,
  confirmRegister
};