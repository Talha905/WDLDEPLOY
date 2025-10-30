const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  joinSession,
  leaveSession,
  getSessionMessages,
  checkSessionAccess,
  updateSessionStatus
} = require('../controllers/sessionController');
const { authRequired } = require('../middleware/auth');

router.post('/', authRequired, createSession);
router.get('/', authRequired, getSessions);
router.get('/:id', authRequired, getSession);
router.put('/:id', authRequired, updateSession);
router.delete('/:id', authRequired, deleteSession);
router.get('/:id/access', authRequired, checkSessionAccess);
router.post('/:id/join', authRequired, joinSession);
router.post('/:id/leave', authRequired, leaveSession);
router.get('/:id/messages', authRequired, getSessionMessages);
router.put('/:id/status', authRequired, updateSessionStatus);

module.exports = router;