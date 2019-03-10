module.exports = {
  type: 'object',
  properties: {
    cost: {
      type: 'number',
      minimum: 0
    },
    note: {
      type: 'string',
      minLength: 20
    }
  },
  required: ['cost', 'note'],
  errorMessage: {
    properties: {
      cost: 'Cost should be a number >= 0',
      note: 'Note should have 20 characters'
    }
  }
};
