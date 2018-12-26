const express = require('express');
const router = express.Router({});
const UserCtrl = require('../controllers/transaction-history/transaction-history.controller');

// GET
router.get('/list-my', UserCtrl.listMyTransactionHistory);
router.get('/list-child', UserCtrl.listChildTransactionHistory);

module.exports = router;