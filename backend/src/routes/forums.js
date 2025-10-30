const express = require('express');
const router = express.Router();
const {
  getCategories,
  getThreads,
  createThread,
  getThread,
  getReplies,
  createReply
} = require('../controllers/forumController');
const { authRequired } = require('../middleware/auth');

router.get('/categories', authRequired, getCategories);
router.get('/threads', authRequired, getThreads);
router.post('/threads', authRequired, createThread);
router.get('/threads/:threadId', authRequired, getThread);
router.get('/threads/:threadId/replies', authRequired, getReplies);
router.post('/threads/:threadId/replies', authRequired, createReply);

module.exports = router;