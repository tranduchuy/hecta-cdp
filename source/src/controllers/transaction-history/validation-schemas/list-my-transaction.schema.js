const transType = require('../../../constants/transaction-type.constant');
module.exports = {
    type: 'object',
    properties: {
        page: {
            type: 'string',
            pattern: '\d*'
        },
        startDay: {
            type: 'string', //yyyy-mm-dd
            pattern: '\d{4}-\d{2}-\d{2}',
        },
        endDay: {
            type: 'string', //yyyy-mm-dd
            pattern: '\d{4}-\d{2}-\d{2}',
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