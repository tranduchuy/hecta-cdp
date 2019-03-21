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
    note: {
      type: 'string',
      minLength: 20
    }
  },
  errorMessage: {
    properties: {
      userId: 'UserId should be a number',
      cost: 'Cost should be a number >= 0',
      note: 'Note should have 20 characters'
    }
  },
  required: ['userId', 'cost', 'content']
};