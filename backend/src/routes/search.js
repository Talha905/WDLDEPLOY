const express = require('express');
const router = express.Router();
const { searchMentors, getMentorProfile } = require('../controllers/searchController');
const { authRequired } = require('../middleware/auth');

router.get('/mentors', authRequired, searchMentors);
router.get('/mentors/:id', authRequired, getMentorProfile);

module.exports = router;