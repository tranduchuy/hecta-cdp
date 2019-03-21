// that's mean not check token in these apis
module.exports = [
  // user
  '/user/login',
  '/user/register',
  '/user/confirm-email',
  '/user/highlight',
  '/user/check-email-username',
  '/user/forget-password',
  '/user/reset-password',
  '/user/resend-confirm-email',
  '/user/balance/purchase-by-view-sale', // TODO: should make it more security
];