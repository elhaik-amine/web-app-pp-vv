const express = require('express');
const router  = express.Router();
const { logout, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/logout',          logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
