const GlobalConstant = require('../../constants/global.constant');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);
const TransHisService = require('./transaction-history.service');
const RequestService = require('../../services/request.service');
const AJV = require('../../core/ajv');
const ctrlNm = 'TransactionHistoryController';
const userRole = require('../../constants/user-role.constant');

// models
/**
 * @type TransactionModel
 */
const TransactionModel = require('../../models/transaction.model');

// schemas
const getListMyTransactionHistory = require('./validation-schemas/list-my-transaction.schema');

const listMyTransactionHistory = async (req, res, next) => {
    logger.info('TransactionHistory::listMyTransactionHistory::called');
    try {
        const errors = AJV(getListMyTransactionHistory, req.query);
        if (errors.length !== 0) {
            return res.json({
                status: HttpCodeConstant.Error,
                messages: errors,
                data: {meta: {}, entries: []}
            });
        }
    
        if (req.user.role != userRole.EndUser) {
            return res.json({
                status: HttpCodeConstant.Error,
                messages: ['User Is Not Role'],
                data: {meta: {}, entries: []}
            });
        }
        
        const paginationOptions = RequestService.extractPaginationCondition(req);
        const optionQuery = TransHisService.extractSearchCondition(req);
        const result = await TransHisService.getListMyTransactionHistory(optionQuery,paginationOptions);
    
        logger.info(`${ctrlNm}::listMyTransactionHistory::success`);
    
        return res.json({
            status: HttpCodeConstant.Success,
            messages: ['Success'],
            data: {
                meta: {
                    totalRecords: result.count,
                    limit: optionQuery.limit,
                    currentPage: optionQuery.page
                },
                entries: result.rows
            }
        });
        
    } catch (e) {
        logger.error(`${ctrlNm}::listMyTransactionHistory::error`, e);
        return next(e);
    }
};

module.exports = {
    listMyTransactionHistory
};