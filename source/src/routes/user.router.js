const express = require('express');
const router = express.Router({});
const UserCtrl = require('../controllers/user/user.controller');

router.get('/login', UserCtrl.login);

module.exports = router;