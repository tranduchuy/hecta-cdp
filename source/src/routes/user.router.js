const express = require('express');
const router = express.Router({});
const UserCtrl = require('../controllers/user/user.controller');

router.post('/login', UserCtrl.login);
router.post('/register', UserCtrl.register);
router.get('/confirm-email', UserCtrl.confirmRegister);
router.get('/info', UserCtrl.getInfoLoggedIn);

module.exports = router;