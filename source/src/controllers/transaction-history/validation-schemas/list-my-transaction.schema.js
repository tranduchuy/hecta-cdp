const transType = require('../../../constants/transaction-type.constant');
const TransConstant = require('../transaction-history.constant');
module.exports = {
    type: 'object',
    properties: {
        page: {
            type: 'string',
        },
        startDay: {
            type: 'string', //yyyy-mm-dd
            pattern: TransConstant.patternDate,
        },
        endDay: {
            type: 'string', //yyyy-mm-dd
            pattern: TransConstant.patternDate,
        },
        type: {
            type: 'string',
        },
        limit: {
            type: 'string',
        },
    },
    required: []
};