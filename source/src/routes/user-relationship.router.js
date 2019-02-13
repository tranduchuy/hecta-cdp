const express = require('express');
/**
 * @type {Object}
 */
const router = express.Router({});
const UserRelationShipCtrl = require('../controllers/user-relationship/user-relationship.controller');

// GET
router.get('/children', UserRelationShipCtrl.listChildren);
router.get('/child-detail', UserRelationShipCtrl.getDetailChild);
router.get('/request', UserRelationShipCtrl.listRequest);
router.get('/detail-for-notifies', UserRelationShipCtrl.getListDetailById);

// POST
router.post('/add-registered-child', UserRelationShipCtrl.addRegisteredChild);
router.post('/child-reply-request', UserRelationShipCtrl.replyRequest);
router.post('/add-child', UserRelationShipCtrl.addNewChild);

// PUT

// DELETE
router.delete('/remove-child', UserRelationShipCtrl.removeChild);
router.delete('/remove-parent', UserRelationShipCtrl.removeParent);

module.exports = router;