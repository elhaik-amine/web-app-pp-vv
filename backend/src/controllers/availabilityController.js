const { pool } = require("../config/db");

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

const getProviderAvailability = async (req, res) => {
  try {
    const providerId = Number(req.params.id);
    if (!providerId) {
      return res.status(400).json({ success: false, message: "Invalid provider id" });
    }

    const [providerRows] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'PROVIDER' AND status = 'ACTIVE'",
      [providerId]
    );
    if (providerRows.length === 0) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const [rows] = await pool.execute(
      "SELECT day_of_week, is_available FROM provider_availability WHERE provider_id = ? ORDER BY day_of_week ASC",
      [providerId]
    );

    const map = new Map(rows.map((r) => [r.day_of_week, Number(r.is_available) === 1]));
    const data = ALL_DAYS.map((day) => ({
      day_of_week: day,
      is_available: map.has(day) ? map.get(day) : true,
    }));

    return res.json({
      success: true,
      provider_id: providerId,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProviderAvailability = async (req, res) => {
  try {
    const providerId = Number(req.params.id);
    const availableDaysRaw = req.body.available_days;

    if (!providerId) {
      return res.status(400).json({ success: false, message: "Invalid provider id" });
    }
    if (!Array.isArray(availableDaysRaw)) {
      return res.status(400).json({ success: false, message: "available_days must be an array" });
    }

    const uniqueDays = [...new Set(availableDaysRaw.map((d) => Number(d)))].sort((a, b) => a - b);
    const hasInvalidDay = uniqueDays.some((d) => !ALL_DAYS.includes(d));
    if (hasInvalidDay) {
      return res.status(400).json({ success: false, message: "available_days must contain values from 1 to 7" });
    }

    if (req.user.role !== "ADMIN" && req.user.id !== providerId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [providerRows] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'PROVIDER'",
      [providerId]
    );
    if (providerRows.length === 0) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    for (const day of ALL_DAYS) {
      const isAvailable = uniqueDays.includes(day) ? 1 : 0;
      await pool.execute(
        `INSERT INTO provider_availability (provider_id, day_of_week, is_available)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE is_available = VALUES(is_available), updated_at = CURRENT_TIMESTAMP`,
        [providerId, day, isAvailable]
      );
    }

    const data = ALL_DAYS.map((day) => ({
      day_of_week: day,
      is_available: uniqueDays.includes(day),
    }));

    return res.json({
      success: true,
      message: "Availability updated successfully",
      provider_id: providerId,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProviderAvailability, updateProviderAvailability };

