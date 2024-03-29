module.exports = {
  type: 'object',
  properties: {
    cost: {
      type: 'number',
      minimum: 0
    },
    saleId: {
      type: 'string',
      minLength: 24
    }
  },
  required: ['cost', 'saleId'],
  errorMessage: {
    properties: {
      cost: 'Cost should be a number >= 0',
      saleId: 'Field saleId should have 24 characters as mongoID'
    }
  }
};
