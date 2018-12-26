module.exports = {
  type: 'object',
  properties: {
    childId: {
      type: 'number',
      minimum: 1
    },
    amount: {
      type: 'number',
      minimum: 1
    }
  },
  required: ['childId', 'amount']
};