const express = require('express');
const router = express.Router({});
const UserCtrl = require('../controllers/transaction-history/transaction-history.controller');

// GET
router.get('/my-list', UserCtrl.listMyTransactionHistory());

module.exports = router;