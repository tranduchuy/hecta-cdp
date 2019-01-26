const GenderConstant = require('../../../constants/gender.constant');

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
      minLength: 11
    },
    address: {
      type: 'string',
      maxLength: 200
    },
    gender: {
      enum: [GenderConstant.Male, GenderConstant.Female]
    },
    name: {
      type: 'string',
      minLength: 3
    },
    username: {
      type: 'string',
      minLength: 6
    },
    city: {
      type: 'string'
    },
    district: {
      type: 'number'
    },
    ward: {
      type: 'number'
    },
    birthday: {
      type: 'string',
      maxLength: 10,
      minLength: 10
    }
  },
  required: ['email', 'password', 'confirmedPassword', 'username', 'name']
};