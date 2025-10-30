const express = require('express');
const router = express.Router();
const {
  createDispute,
  getDisputes,
  getDispute,
  updateDispute,
  resolveDispute
} = require('../controllers/disputeController');
const { authRequired } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roles');

router.post('/', authRequired, createDispute);
router.get('/', authRequired, getDisputes);
router.get('/:id', authRequired, getDispute);
router.put('/:id', authRequired, requireRole(ROLES.ADMIN), updateDispute);
router.post('/:id/resolve', authRequired, requireRole(ROLES.ADMIN), resolveDispute);

module.exports = router;