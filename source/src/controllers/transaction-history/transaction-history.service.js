const GlobalConstant = require('../../constants/global.constant');
const StatusConstant = require('../../constants/status.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);

// models
/**
 * @type TransactionModel
 */
const TransactionModel = require('../../models/transaction.model');

const isValidToBeChild = async (userId) => {
};

module.exports = {
  isValidToBeChild,
};