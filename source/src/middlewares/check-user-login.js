const config = require('config');
const jwt = require('jsonwebtoken');
const GlobalConstant = require('../constants/global.constant');
const StatusConstant = require('../constants/status.constant');
const HttpCodeConstant = require('../constants/http-code.constant');
const UserModel = require('../models/user.model');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.App);

const responseAccessDenied = {
  status: HttpCodeConstant.Error,
  messages: ['Access denied'],
  data: {
    meta: {},
    entries: []
  }
};

module.exports = async (req, res, next) => {
  const token = req.get(GlobalConstant.ApiTokenName);

  try {
    let userInfo = jwt.verify(token, config.get('jwt').secret);
    userInfo = JSON.parse(userInfo);

    const user = await UserModel.findOne({
      where: {
        email: userInfo.email
      }
    });

    if (!user || user.status !== StatusConstant.Active) {
      logger.error('CheckUserLogin::error. Access denied. User not found or status not active', JSON.stringify(userInfo));
      return res.json(responseAccessDenied);
    }

    req.user = user;
    return next();
  } catch(err) {
    logger.error('CheckUserLogin::error. Cannot verify access token', err);

    return res.json(responseAccessDenied);
  }
};