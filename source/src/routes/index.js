const express = require('express');
const router = express.Router({});
const checkLoginMiddleware = require('../middlewares/check-user-login');

router.use(checkLoginMiddleware);
router.use('/user', require('./user.router'));
router.use('/user-relationship', require('./user-relationship.router'));

module.exports = router;