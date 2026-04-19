const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const {
  getProviders,
  getProviderById,
  updateProviderProfile,
} = require("../controllers/providerController");
const { protect, restricted } = require("../middlewares/authMiddleware");

router.get("/", protect, restricted, getProviders);
// GET /api/providers/:id/availability
router.get("/:id/availability", protect, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT day_of_week, is_available FROM provider_availability WHERE provider_id = ?",
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/:id", protect, restricted, getProviderById);
router.put("/:id", protect, restricted, updateProviderProfile);

module.exports = router;
