const StatusConstant = require('../../../constants/status.constant');

module.exports = {
  type: 'object',
  properties: {
    relationId: {
      type: 'number',
      minValue: 1
    },
    status: {
      type: 'number',
      enum: [StatusConstant.ChildAccepted, StatusConstant.ChildRejected]
    }
  },
  required: ['relationId', 'status']
};