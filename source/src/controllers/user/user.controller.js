const bcrypt = require('bcrypt');
const UserService = require('./user.service');
const UserModel = require('../../models/user.model');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const Ajv = require('ajv');
const ajv = Ajv({allErrors: true});

// constants
const StatusConstant = require('../../constants/status.constant');

// validate schema
const loginSchema = require('./validation-schemas/login');
const registerSchema = require('./validation-schemas/register');

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
    const valid = ajv.validate(loginSchema, req.body);

    if (!valid) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: ajv.errors.map(t => t.message),
        data: {}
      });
    }

    const {email, username, password} = req.body;
    const users = await UserService.findByEmailOrUsername(email, username);
    if (users.length === 0) {
      logger.warn('UserController::login::warn. User not found');
      return next(new Error('User not found'));
    }

    const user = users[0];
    if (!UserService.isValidHashPassword(user.passwordHash, password)) {
      logger.error(`UserController::login::error. Wrong password. Try input password "${password}" for user "${user.id}"`);
      return next(new Error('Wrong password'));
    }

    if (user.status !== StatusConstant.Active) {
      logger.error(`UserController::login::error. User is not active. User: ${user.id}`);
      return next(new Error('User inactive'));
    }

    // TODO: generate login token, and save it

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Successfully'],
      data: {
        meta: {},
        entries: [user]
      }
    });
  } catch (e) {
    logger.error('UserController::login::error', e);
    return next(e);
  }
};

/**
 *
 * @param req {body: {email, password, type, name, username, phone}}
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const register = async (req, res, next) => {
  logger.info('UserController::login::called');

  try {
    const valid = ajv.validate(registerSchema, req.body);

    if (!valid) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: ajv.errors.map(t => t.message),
        data: {}
      });
    }

    const {email, password, confirmedPassword, name, username, phone} = req.body;

    // TODO: create token to confirm by email. Send email

    if (password !== confirmedPassword) {
      logger.error('UserController::register::error. 2 passwords not same');
      return next(new Error('2 passwords not same'));
    }

    const duplicatedUsers = await UserModel.findAll({where: {email}});
    if (duplicatedUsers.length !== 0) {
      logger.error('UserController::register::error. Duplicate email');
      return next(new Error('Duplicate email'));
    }
    await UserService.createUser(req.body);

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
 * Confirm token in email after registering
 * @param req
 * @param res
 * @param next
 * @returns {Promise<*>}
 */
const confirmRegister = async(req, res, next) => {
  logger.info('UserController::confirmRegister::called');

  try {
    const {token} = req.query;
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

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Success'],
      data: {
        meta: {},
        entries: []
      }
    })
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