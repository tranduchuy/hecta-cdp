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
  required: ['password', 'email'],
  errorMessage: {
    required: {
      email: "Email is required",
      password: "Password is required"
    },
    minLength: {
      password: "minlenth password"
    }
  }
};