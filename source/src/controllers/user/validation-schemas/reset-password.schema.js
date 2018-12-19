module.exports = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      maxLength: 50
    },
    password: {
      type: 'string',
      minLength: 6
    },
    confirmedPassword: {
      type: 'string',
      minLength: 6
    }
  },
  required: ['token', 'password', 'confirmedPassword']
};
