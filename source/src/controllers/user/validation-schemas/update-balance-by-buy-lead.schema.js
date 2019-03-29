module.exports = {
  type: 'object',
  properties: {
    cost: {
      type: 'number',
      minimum: 0
    },
    leadId: {
      type: 'string',
      minLength: 24
    }
  },
  required: ['cost', 'leadId'],
  errorMessage: {
    properties: {
      cost: 'Cost should be a number >= 0',
      leadId: 'Field leadId should have 24 characters as mongoID'
    }
  }
};
