const express = require('express');
const router = express.Router();
const { getBalance, getHistory, buyTokens } = require('../controllers/tokenController');
const { protect, restricted } = require('../middlewares/authMiddleware');

router.get('/balance', protect, restricted, getBalance);
router.get('/history', protect, restricted, getHistory);
router.post('/buy',    protect, restricted, buyTokens);

module.exports = router;
