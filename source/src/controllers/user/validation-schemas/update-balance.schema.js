module.exports = {
  type: 'object',
  properties: {
    userId: {
      type: 'number',
      minimum: 1
    },
    main1: {
      type: 'number',
      minimum: 0,
    },
    main2: {
      type: 'number',
      minimum: 0,
    },
    promo: {
      type: 'number',
      minimum: 0,
    }
  },
  required: ['userId']
};