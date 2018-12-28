module.exports = {
  type: 'object',
  properties: {
    parentId: {
      type: 'string',
      pattern: '\\d+',
      minLength: 1
    }
  },
  required: []
};