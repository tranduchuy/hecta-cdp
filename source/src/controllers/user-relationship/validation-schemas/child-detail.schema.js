module.exports = {
  type: 'object',
  properties: {
    childId: {
      type: 'string',
      pattern: '[\\d]+',
      minLength: 1
    }
  },
  required: ['childId']
};