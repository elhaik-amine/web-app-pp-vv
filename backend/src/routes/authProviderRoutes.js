const express = require('express');
const router  = express.Router();
const { registerProvider, loginProvider } = require('../controllers/authProviderController');

router.post('/register', registerProvider);
router.post('/login',    loginProvider);

module.exports = router;
