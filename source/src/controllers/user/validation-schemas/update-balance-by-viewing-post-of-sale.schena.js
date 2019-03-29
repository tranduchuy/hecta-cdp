module.exports = {
  type: 'object',
  properties: {
    userId: {
      type: 'number'
    },
    cost: {
      type: 'number',
      minimum: 1
    },
    saleId: {
      type: 'string',
      minLength: 24
    },
    adStatId: {
      type: 'string',
      minLength: 24
    }
  },
  errorMessage: {
    properties: {
      userId: 'UserId should be a number',
      cost: 'Cost should be a number >= 0',
      saleId: 'Field saleId should have 24 characters as mongoID',
      adStatId: 'Field adStatId should have 24 characters as mongoID'
    }
  },
  required: ['userId', 'cost', 'saleId', 'adStatId']
};