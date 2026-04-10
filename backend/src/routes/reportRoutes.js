const express = require('express');
const router = express.Router();
const { createReport, getReports } = require('../controllers/reportController');
const { protect, restricted } = require('../middlewares/authMiddleware');

router.post('/', protect, restricted, createReport);
router.get('/',  protect, restricted, getReports);

module.exports = router;
