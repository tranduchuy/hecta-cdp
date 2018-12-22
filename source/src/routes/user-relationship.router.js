const express = require('express');
const router = express.Router({});
const UserRelationShipCtrl = require('../controllers/user-relationship/user-relationship.controller');

// GET
router.get('/children', UserRelationShipCtrl.listChildren);

// POST
router.post('/add-registered-child', UserRelationShipCtrl.addRegisteredChild);
router.post('/child-reply-request', UserRelationShipCtrl.replyRequest);

// PUT

module.exports = router;