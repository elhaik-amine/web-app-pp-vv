const express = require('express');
const router  = express.Router();
const { getProviders, getProviderById } = require('../controllers/providerController');
const { protect, restricted } = require('../middlewares/authMiddleware');

router.get('/',    protect, restricted, getProviders);
router.get('/:id', protect, restricted, getProviderById);

module.exports = router;
