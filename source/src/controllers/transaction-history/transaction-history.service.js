const GlobalConstant = require('../../constants/global.constant');
const StatusConstant = require('../../constants/status.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);
const moment = require('moment');

// models
/**
 * @type Model
 */
const TransactionModel = require('../../models/transaction.model');
const UserModel = require('../../models/user.model');

/**
 *
 * @param req
 * @param childId
 * @returns {{userId: (*|string)}}
 */
const extractSearchCondition = function (req, childId) {
    const cond = {
        userId: childId || req.user.id
    };
    
    const {startDay, endDay, type} = req.query;
    
    if (startDay) {
        cond.createdAt = cond.createdAt || {};
        const dateTimeStart = new Date(startDay);
        cond.createdAt['$gte'] = moment(dateTimeStart).format("YYYY-MM-DD HH:mm:ss");
    }
    
    if (endDay) {
        cond.createdAt = cond.createdAt || {};
        const dateTimeEnd = new Date(endDay);
        cond.createdAt['$lte'] = moment(dateTimeEnd).format("YYYY-MM-DD HH:mm:ss");
    }
    
    if (type) {
        cond.type = parseInt(type, 0);
    }
    
    return cond;
};

/**
 *Get list My Transaction History with
 * @param userId
 * @param options
 * @returns {Promise<{count: Integer, rows: Model[]}>}
 */
const getListMyTransactionHistory = async  (optionQuery, paginationOptions) => {
    return await TransactionModel.findAndCountAll({
        where: {
            optionQuery
        },
        include: [
            {
                model: UserModel,
                as: 'fromUserInfo',
                attributes: ['email', 'name', 'username', 'phone']
            }
        ],
        order: [
            [
                'createdAt',
                'DESC',
            ]
        ],
        offset: paginationOptions.limit * (paginationOptions.page - 1),
        limit: paginationOptions.limit
    });
};

module.exports = {
    extractSearchCondition,
    getListMyTransactionHistory,
};