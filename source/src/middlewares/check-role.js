const HttpCodeConstant = require('../constants/http-code.constant');

module.exports = (roles) => {
  const _roles = Array.isArray(roles) ? roles : [roles];

  return async (req, res, next) => {
    if (!_roles.some(r => r === req.user.role)) {
      return res.json({
        status: HttpCodeConstant.Error,
        messages: ['Permission denied'],
        data: {meta: {}, entries: []}
      });
    }

    return next();
  }
};