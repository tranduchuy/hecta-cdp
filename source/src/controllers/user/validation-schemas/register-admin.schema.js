module.exports = {
  type: 'object',
  properties: {
    email: {
      format: 'email'
    },
    password: {
      type: 'string',
      minLength: 6
    },
    confirmedPassword: {
      type: 'string',
      minLength: 6
    },
    phone: {
      type: 'string',
      maxLength: 11
    },
    name: {
      type: 'string',
      minLength: 3
    },
    username: {
      type: 'string',
      minLength: 6
    }
  },
  required: ['email', 'password', 'confirmedPassword', 'username', 'name', 'phone']
};