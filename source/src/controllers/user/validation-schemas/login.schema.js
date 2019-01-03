module.exports = {
  type: 'object',
  properties: {
    email: {
      maxLength: 100,
      format: 'email'
    },
    username: {
      maxLength: 100,
      minLength: 6
    },
    password: {
      maxLength: 100,
      minLength: 6
    }
  },
  required: ['password'],
  anyOf: [
    {required: ['email']},
    {required: ['username']}
  ]
};