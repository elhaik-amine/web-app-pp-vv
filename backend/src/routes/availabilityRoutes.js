const express = require("express");
const router = express.Router();
const { protect, restricted, role } = require("../middlewares/authMiddleware");
const {
  getProviderAvailability,
  updateProviderAvailability,
} = require("../controllers/availabilityController");

router.get("/:id/availability", protect, restricted, getProviderAvailability);
router.put("/:id/availability", protect, restricted, role("PROVIDER", "ADMIN"), updateProviderAvailability);

module.exports = router;

