const express = require('express');
const router = express.Router({});
const UserRelationShipCtrl = require('../controllers/user-relationship/user-relationship.controller');

// GET
router.get('/children', UserRelationShipCtrl.listChildren);
router.get('/child-retail', UserRelationShipCtrl.getDetailChild);
router.get('/request', UserRelationShipCtrl.listRequest);

// POST
router.post('/add-registered-child', UserRelationShipCtrl.addRegisteredChild);
router.post('/child-reply-request', UserRelationShipCtrl.replyRequest);
router.post('/add-child', UserRelationShipCtrl.addNewChild);

// PUT

module.exports = router;