const express = require('express');
const router = express.Router({});
const checkLoginMiddleware = require('../middlewares/check-user-login');

router.use(checkLoginMiddleware);
router.use('/user', require('./user.router'));

module.exports = router;