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
  required: ['cost', 'note']
};