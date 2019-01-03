const express = require('express');
/**
 * @type {Object}
 */
const router = express.Router({});
const checkLoginMiddleware = require('../middlewares/check-user-login');

router.use(checkLoginMiddleware);
router.use('/user', require('./user.router'));
router.use('/user-relationship', require('./user-relationship.router'));
router.use('/transaction-history', require('./transaction-history.router'));

module.exports = router;