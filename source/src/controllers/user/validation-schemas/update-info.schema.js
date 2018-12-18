const UserTypeConstant = require('../../../constants/user-type.constant');
const StatusConstant = require('../../../constants/status.constant');

module.exports = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 3
    },
    phone: {
      type: 'string',
      pattern: '\d+',
      minLength: 10,
      maxLength: 11
    },
    address: {
      type: 'string',
      maxLength: 100
    },
    status: {
      enum: [
        StatusConstant.Active,
        StatusConstant.PendingOrWaitConfirm,
        StatusConstant.Blocked,
        StatusConstant.Delete
      ]
    },
    gender: {
      type: 'integer'
    },
    oldPassword: {
      type: 'string',
      minLength: 6
    },
    password: {
      type: 'string',
      minLength: 6
    },
    confirmedPassword: {
      type: 'string',
      minLength: 6
    },
    type: {
      enum: [UserTypeConstant.Company, UserTypeConstant.Personal]
    }
  },
  required: [],
  switch: [
    {
      if: {required: ['password']},
      then: {required: ['oldPassword', 'confirmedPassword']},
      continue: true
    }
  ]
};