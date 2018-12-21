module.exports = {
  type: 'object',
  properties: {
    page: {
      type: 'string',
      pattern: '\d*'
    },
    limit: {
      type: 'string',
      pattern: '\d*',
      maxLength: 3 // 999
    },
    sortBy: {
      type: 'string',
      enum: ['name', 'email', 'username', 'phone', 'address', 'gender']
    },
    sortDirection: {
      type: 'string',
      enum: ['asc', 'desc', 'ASC', 'DESC']
    }
  },
  required: []
};