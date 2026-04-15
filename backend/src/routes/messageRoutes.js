const express = require('express');
const router = express.Router({ mergeParams: true });
const { getMessages } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);
router.get('/', getMessages);

module.exports = router;