const UserConstant = require('../user.constant');

module.exports = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      minLength: UserConstant.tokenConfirmEmailLength
    }
  },
  required: ['token']
};