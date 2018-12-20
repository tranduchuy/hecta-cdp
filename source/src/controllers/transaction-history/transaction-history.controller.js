const GlobalConstant = require('../../constants/global.constant');
const HttpCodeConstant = require('../../constants/http-code.constant');
const log4js = require('log4js');
const logger = log4js.getLogger(GlobalConstant.LoggerTargets.Controller);
const URService = require('./transaction-history.service');
const AJV = require('../../core/ajv');
const ctrlNm = 'TransactionHistoryController';

// models
/**
 * @type TransactionModel
 */
const TransactionModel = require('../../models/transaction.model');

const listMyTransactionHistory = async (req, res, next) => {
  logger.info('TransactionHistory::listMyTransactionHistory::called');
  try {
    // TODO: get list my transaction history
  } catch (e) {

  }
};

module.exports = {
    listMyTransactionHistory
};