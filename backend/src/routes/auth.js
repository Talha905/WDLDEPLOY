const express = require('express');
const router = express.Router();
const { register, login, me, updateProfile, addExpertise, requestMentor } = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);
router.put('/profile', authRequired, updateProfile);
router.post('/expertise', authRequired, addExpertise);
router.post('/request-mentor', authRequired, requestMentor);

module.exports = router;
