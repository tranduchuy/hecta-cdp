module.exports = {
  type: 'object',
  properties: {
    childId: {
      type: 'number',
      minValue: 1
    },
    amount: {
      type: 'number',
      minValue: 1
    }
  },
  required: ['childId', 'amount']
};