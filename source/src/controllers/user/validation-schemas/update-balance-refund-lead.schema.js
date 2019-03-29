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
    leadId: {
      type: 'string',
      minLength: 24
    }
  },
  required: ['userId', 'cost', 'leadId'],
  errorMessage: {
    properties: {
      userId: 'User id is required as number >= 1',
      cost: 'Cost must be a number >= 0',
      leadId: 'Field leadId should be 24 string length as mongoID'
    }
  }
};