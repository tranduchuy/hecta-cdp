const UserTypeConstant = require('../../../constants/user-type.constant');
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
      maxLength: 11
    },
    address: {
      type: 'string',
      maxLength: 200
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
    gender: {
      enum: [0, GenderConstant.Male, GenderConstant.Female]
    },
    name: {
      type: 'string',
      minLength: 3
    },
    type: {
      type: 'number',
      enum: [UserTypeConstant.Company, UserTypeConstant.Personal]
    },
    username: {
      type: 'string',
      minLength: 6
    }
  },
  required: ['email', 'password', 'confirmedPassword', 'type', 'username', 'name']
};