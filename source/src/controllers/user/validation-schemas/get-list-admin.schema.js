module.exports = {
  type: 'object',
  properties: {
    sortBy: {
      type: 'string'
    },
    sd: {
      enum: ['asc', 'ASC', 'desc', 'DESC']
    },
    page: {
      type: 'string',
      pattern: '\\d+'
    },
    limit: {
      type: 'string',
      pattern: '\\d+'
    },
    name: {
      type: 'string'
    },
    email: {
      type: 'string'
    },
    username: {
      type: 'string'
    },
    role: {
      type: 'string',
      pattern: '\\d+'
    },
    gender: {
      type: 'string'
    },
    phone: {
      type: 'string',
      pattern: '\\d+'
    }
  },
  required: []
};