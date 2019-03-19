const express = require('express');
/**
 * @type {Object}
 */
const router = express.Router({});
const UserCtrl = require('../controllers/user/user.controller');
const UR = require('../constants/user-role.constant');
const checkRoleMiddleware = require('../middlewares/check-role');

// GET
router.get('/confirm-email', UserCtrl.confirmRegister);
router.get('/resend-confirm-email', UserCtrl.resendConfirmRegister);
router.get('/info', UserCtrl.getInfoLoggedIn);
router.get('/valid-token', UserCtrl.checkValidToken);
router.get('/check-email-username', UserCtrl.checkDuplicateEmailOrUsername);
router.get('/forget-password', UserCtrl.forgetPassword);
router.get('/find-detail', UserCtrl.findDetailByEmail);
router.get('/highlight', UserCtrl.getHighlightUser);
router.get('/', checkRoleMiddleware([UR.Admin, UR.Master]), UserCtrl.getList);
router.get('/info-by-ids', UserCtrl.getListBasicInfoByIds);
router.get('/admin-get-user-info/:id', checkRoleMiddleware([UR.Master]), UserCtrl.adminGetDetailUserInfoById);
router.get('/for-notifies', UserCtrl.getListByIdsForNotifies);
router.get('/admin', checkRoleMiddleware([UR.Master]), UserCtrl.getListAdmin);

// PUT
router.put('/:id', UserCtrl.updateInfo);
router.put('/admin-status/:adminId', checkRoleMiddleware([UR.Master]), UserCtrl.updateStatusAdmin);

// POST
router.post('/login', UserCtrl.login);
router.post('/register', UserCtrl.register);
router.post('/register-admin', checkRoleMiddleware([UR.Master]), UserCtrl.registerAdmin);
router.post('/reset-password', UserCtrl.resetPassword);
router.post('/share-credit', UserCtrl.shareBalanceToChild);
router.post('/balance', UserCtrl.updateBalance);
router.post('/balance/sale-cost', UserCtrl.updateBalanceSaleCost);
router.post('/balance/up-news-cost', UserCtrl.updateBalanceUpNewsCost);
router.post('/balance/buy-lead', UserCtrl.updateBalanceBuyLead);
router.post('/balance/revert-buy-lead', UserCtrl.updateBalanceBuyLead);

module.exports = router;
