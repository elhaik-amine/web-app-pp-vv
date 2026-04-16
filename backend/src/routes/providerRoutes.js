const express = require("express");
const router = express.Router();
const {
  getProviders,
  getProviderById,
  updateProviderProfile,
} = require("../controllers/providerController");
const { protect, restricted } = require("../middlewares/authMiddleware");

router.get("/", protect, restricted, getProviders);
router.get("/:id", protect, restricted, getProviderById);
router.put("/:id", protect, restricted, updateProviderProfile);

module.exports = router;
