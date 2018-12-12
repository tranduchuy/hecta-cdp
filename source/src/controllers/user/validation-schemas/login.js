module.exports = {
  type: 'object',
  properties: {
    email: {
      maxLength: 100,
      minLength: 5,
      format: 'email'
    },
    username: {
      maxLength: 100,
      minLength: 3
    },
    password: {
      maxLength: 100,
      minLength: 6
    }
  },
  required: ['password'],
  oneOf: [
    {required: ['email']},
    {required: ['username']}
  ]
};