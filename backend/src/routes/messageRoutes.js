const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives access to :bookingId from parent
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect, restricted } = require('../middlewares/authMiddleware');

router.get('/',  protect, restricted, getMessages);
router.post('/', protect, restricted, sendMessage);

module.exports = router;
