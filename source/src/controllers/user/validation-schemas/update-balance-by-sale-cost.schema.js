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
      minLength: 20
    }
  },
  required: ['userId', 'cost', 'note']
};