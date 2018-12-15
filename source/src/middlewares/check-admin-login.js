const GlobalConstant = require('../constants/global.constant');
const HttpCodeConstant = require('../constants/http-code.constant');
const UserRoleConstant = require('../constants/user-role.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.App);

module.exports = async (req, res, next) => {
  if (![UserRoleConstant.Master, UserRoleConstant.Admin].some(req.user.role)) {
    return res.json({
      status: HttpCodeConstant.Error,
      messages: [],
      data: {
        meta: {},
        entries: []
      }
    });
  }

  logger.info(`CheckAdminLogin::success. Admin ${user.email} is logging in`);

  return next();
};