const UserService = require('./user.service');
const UserModel = require('../../models/user.model');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const Ajv = require('ajv');
const ajv = Ajv({allErrors: true});
const loginSchema = require('./validation-schemas/login');

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

    // TODO: login function

    return res.json({
      status: HttpCodeConstant.Success,
      messages: ['Successfully'],
      data: {
        meta: {},
        entries: []
      }
    });
  } catch (e) {
    logger.error('UserController::login::error', e);
    return next(e);
  }
};

const register = (req, res, next) => {
  logger.info('UserController::login::called');

  try {
    // TODO: register function
  } catch (e) {
    logger.error('UserController::login::error', e);
    return next(e);
  }
};

module.exports = {
  login,
  register
};