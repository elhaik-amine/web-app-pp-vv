const express = require('express');
const router = express.Router();
const {
  getDashboard, getUsers, warnUser, restrictUser, suspendUser, activateUser, deleteUser,
  getReports, updateReport, getBookings, completeBooking, getTokenStats,
  loginAdmin,
} = require('../controllers/adminController');
const { protect, role } = require('../middlewares/authMiddleware');

const admin = [protect, role('ADMIN')];

router.post('/login', loginAdmin);

router.get('/dashboard',              ...admin, getDashboard);
router.get('/users',                  ...admin, getUsers);
router.patch('/users/:id/warn',       ...admin, warnUser);
router.patch('/users/:id/restrict',   ...admin, restrictUser);
router.patch('/users/:id/suspend',    ...admin, suspendUser);
router.patch('/users/:id/activate',   ...admin, activateUser);
router.delete('/users/:id',           ...admin, deleteUser);
router.get('/reports',                ...admin, getReports);
router.patch('/reports/:id',          ...admin, updateReport);
router.get('/bookings',               ...admin, getBookings);
router.patch('/bookings/:id/complete',...admin, completeBooking);
router.get('/tokens',                 ...admin, getTokenStats);

module.exports = router;
