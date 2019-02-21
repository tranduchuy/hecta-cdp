const express = require('express');
/**
 * @type {Object}
 */
const router = express.Router({});
const UserCtrl = require('../controllers/user/user.controller');
const UserRoleConstant = require('../constants/user-role.constant');
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
router.get('/', checkRoleMiddleware([UserRoleConstant.Admin, UserRoleConstant.Master]), UserCtrl.getList);
router.get('/info', checkRoleMiddleware([UserRoleConstant.Admin, UserRoleConstant.Master]), UserCtrl.getListBasicInfoByIds);
router.get('/for-notifies', UserCtrl.getListByIdsForNotifies);
router.get('/admin', checkRoleMiddleware([UserRoleConstant.Master]), UserCtrl.getListAdmin);

// PUT
router.put('/:id', UserCtrl.updateInfo);
router.put('/admin-status/:adminId', checkRoleMiddleware([UserRoleConstant.Master]), UserCtrl.updateStatusAdmin);

// POST
router.post('/login', UserCtrl.login);
router.post('/register', UserCtrl.register);
router.post('/register-admin', checkRoleMiddleware([UserRoleConstant.Master]), UserCtrl.registerAdmin);
router.post('/reset-password', UserCtrl.resetPassword);
router.post('/share-credit', UserCtrl.shareBalanceToChild);
router.post('/balance', UserCtrl.updateBalance);
router.post('/balance/sale-cost', UserCtrl.updateBalanceSaleCost);
router.post('/balance/up-news-cost', UserCtrl.updateBalanceUpNewsCost);

module.exports = router;
