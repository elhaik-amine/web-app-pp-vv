const express = require('express');
const router = express.Router();
const { getOffers, getOfferById, createOffer, updateOffer, toggleOffer } = require('../controllers/offerController');
const { protect, role, restricted } = require('../middlewares/authMiddleware');

router.get('/',     getOffers);
router.get('/:id',  getOfferById);
router.post('/',    protect, restricted, role('PROVIDER'), createOffer);
router.put('/:id',  protect, restricted, role('PROVIDER'), updateOffer);
router.patch('/:id/toggle', protect, restricted, role('PROVIDER'), toggleOffer);

module.exports = router;
