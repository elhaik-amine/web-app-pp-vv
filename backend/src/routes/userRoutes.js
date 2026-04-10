const express = require('express');
const router = express.Router();
const { getMe, updateMe, deleteMe, getUserById } = require('../controllers/userController');
const { protect, restricted } = require('../middlewares/authMiddleware');

router.get('/me',     protect, restricted, getMe);
router.put('/me',     protect, restricted, updateMe);
router.delete('/me',  protect, restricted, deleteMe);
router.get('/:id',    protect, getUserById);

module.exports = router;
