const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, toggleCategory } = require('../controllers/categoryController');
const { protect, role } = require('../middlewares/authMiddleware');

router.get('/',               getCategories);
router.post('/',              protect, role('ADMIN'), createCategory);
router.put('/:id',            protect, role('ADMIN'), updateCategory);
router.patch('/:id/toggle',   protect, role('ADMIN'), toggleCategory);

module.exports = router;
