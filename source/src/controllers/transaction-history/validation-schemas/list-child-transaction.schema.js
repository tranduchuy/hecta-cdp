const transType = require('../../../constants/transaction-type.constant');
const TransConstant = require('../transaction-history.constant');
module.exports = {
    type: 'object',
    properties: {
        userId: {
            type: 'string',
            pattern: '\d*'
        },
        page: {
            type: 'string',
            pattern: '\d*'
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
            enum: Object.keys(transType).map((key) => {return transType[key]})
        },
        limit: {
            type: 'string',
            pattern: '\d*',
            maxLength: 3 // 999
        },
    },
    required: []
};