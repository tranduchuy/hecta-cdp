const express = require('express');
const router = express.Router({});
const UserRelationShipCtrl = require('../controllers/user-relationship/user-relationship.controller');

// GET
router.get('/children', UserRelationShipCtrl.listChildren);

// POST
router.post('/add-registered-child', UserRelationShipCtrl.addRegisteredChild);

// PUT

module.exports = router;