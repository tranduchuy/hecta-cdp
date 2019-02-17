const StatusConstant = require('../../../constants/status.constant');

module.exports = {
  type: 'object',
  properties: {
    status: {
      enum: [StatusConstant.Active, StatusConstant.Blocked]
    }
  }
};