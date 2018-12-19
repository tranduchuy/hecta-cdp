const express = require('express');
const router = express.Router({});
const UserCtrl = require('../controllers/user/user.controller');

// GET
router.get('/confirm-email', UserCtrl.confirmRegister);
router.get('/resend-confirm-email', UserCtrl.resendConfirmRegister);
router.get('/info', UserCtrl.getInfoLoggedIn);
router.get('/check-email-username', UserCtrl.checkDuplicateEmailOrUsername);
router.get('/forget-password', UserCtrl.forgetPassword);

// PUT
router.put('/:id', UserCtrl.updateInfo);

// POST
router.post('/login', UserCtrl.login);
router.post('/register', UserCtrl.register);

module.exports = router;