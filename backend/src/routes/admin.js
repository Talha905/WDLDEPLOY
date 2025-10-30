const express = require('express');
const router = express.Router();
const { getUsers, updateUser, getPendingExpertise, approveExpertise, getAnalytics } = require('../controllers/adminController');
const { authRequired } = require('../middleware/auth');
const { requireRole, ROLES } = require('../middleware/roles');

router.use(authRequired, requireRole(ROLES.ADMIN));

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/expertise/pending', getPendingExpertise);
router.put('/users/:userId/expertise/:expertiseName', approveExpertise);
router.get('/analytics', getAnalytics);

module.exports = router;