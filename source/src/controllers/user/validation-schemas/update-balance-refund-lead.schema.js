module.exports = {
  type: 'object',
  properties: {
    userId: {
      type: 'number',
      minimum: 1
    },
    cost: {
      type: 'number',
      minimum: 0
    },
    note: {
      type: 'string',
      minLength: 24
    }
  },
  required: ['userId','cost', 'note'],
  errorMessage: {
    properties: {
      userId: 'User id is required as number >= 1',
      cost: 'Cost must be a number >= 0',
      note: 'Should provide more info about lead'
    }
  }
};