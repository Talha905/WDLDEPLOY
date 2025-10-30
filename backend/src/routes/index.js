const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/sessions', require('./sessions'));
router.use('/goals', require('./goals'));
router.use('/disputes', require('./disputes'));
router.use('/search', require('./search'));
router.use('/admin', require('./admin'));
// Community features
router.use('/forums', require('./forums'));
// router.use('/qa', require('./qa'));
// router.use('/knowledge', require('./knowledge'));

module.exports = router;
