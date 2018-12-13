const UserTypeConstant = require('../../../constants/user-type.constant');

module.exports = {
  type: 'object',
  properties: {
    email: {
      format: 'email'
    },
    password: {
      minLength: 6
    },
    confirmedPassword: {
      minLength: 6
    },
    phone: {
      minLength: 11
    },
    name: {
      minLength: 3
    },
    type: {
      enum: [UserTypeConstant.Company, UserTypeConstant.Personal]
    },
    username: {
      minLength: 6
    }
  },
  required: ['email', 'password', 'confirmedPassword', 'type', 'username', 'name']
};