const transType = require('../../../constants/transaction-type.constant');
const TransConstant = require('../transaction-history.constant');
const types = Object.keys(transType).map((key) => {
  return transType[key].toString();
});

module.exports = {
  type: 'object',
  properties: {
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
      enum: types
    },
    limit: {
      type: 'string',
      pattern: '\d*',
      maxLength: 3 // 999
    },
  },
  required: [],
  errorMessage: {
    properties: {
      page: 'Page should be a number',
      startDay: 'Start day should have pattern yyyy-mm-dd',
      endDay: 'End day should have pattern yyyy-mm-dd',
      type: `Invalid type. It should be ${types.join(',')}`,
      limit: 'Limit should be a number'
    }
  }
};