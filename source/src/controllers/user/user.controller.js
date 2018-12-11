const UserService = require('./user.service');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');

const login = async (req, res, next) => {
    logger.info('UserController::login::called');

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
    login
};