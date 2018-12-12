const UserService = require('./user.service');
const UserModel = require('../../models/user.model');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');

const login = async (req, res, next) => {
  logger.info('UserController::login::called');

  UserModel
    .findAll()
    .then((users) => {
      return res.json({
        status: HttpCodeConstant.Success,
        messages: [],
        data: {
          meta: {},
          entries: users
        }
      });
    })
    .catch((err) => {
      logger.error(err);
    });
};

module.exports = {
  login
};