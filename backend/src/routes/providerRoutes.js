const express = require("express");
const router = express.Router();
const {
  getProviders,
  getProviderById,
  updateProviderProfile,
  getProviderWeekAvailability,
} = require("../controllers/providerController");
const { protect, restricted } = require("../middlewares/authMiddleware");

router.get("/", protect, restricted, getProviders);
router.get("/:id/availability", protect, getProviderWeekAvailability); // 7-day slot availability
router.get("/:id", protect, restricted, getProviderById);
router.put("/:id", protect, restricted, updateProviderProfile);

module.exports = router;
