const { pool } = require("../config/db");

// GET /api/providers?city=&category_id=
// Browse all active providers — the main listing screen
const getProviders = async (req, res) => {
  try {
    const { city, category_id } = req.query;

    let sql = `
      SELECT u.id, u.name, u.avatar,
             pp.description, pp.city, pp.rating, pp.total_reviews, pp.is_verified,
             pp.category_id, sc.name AS category_name
      FROM users u
      JOIN provider_profiles pp  ON pp.user_id = u.id
      LEFT JOIN service_categories sc ON sc.id = pp.category_id
      WHERE u.role = 'PROVIDER' AND u.status = 'ACTIVE' AND pp.is_active = 1
    `;
    const params = [];

    if (city) {
      sql += " AND pp.city = ?";
      params.push(city);
    }
    if (category_id) {
      sql += " AND pp.category_id = ?";
      params.push(Number(category_id));
    }

    sql += " ORDER BY pp.rating DESC, pp.total_reviews DESC";

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/providers/:id
// Full provider profile — shown before the client books
const getProviderById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.avatar, u.phone,
              pp.description, pp.city, pp.rating, pp.total_reviews, pp.is_verified,
              pp.category_id, sc.name AS category_name
       FROM users u
       JOIN provider_profiles pp  ON pp.user_id = u.id
       LEFT JOIN service_categories sc ON sc.id = pp.category_id
       WHERE u.id = ? AND u.role = 'PROVIDER' AND pp.is_active = 1`,
      [req.params.id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Provider not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProviderProfile = async (req, res) => {
  const { id } = req.params;
  const { category_id, description, city } = req.body;

  if (!category_id || !city) {
    return res.status(400).json({
      message: "category_id and city are required",
    });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE provider_profiles
       SET category_id = ?, description = ?, city = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [category_id, description || null, city, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Provider profile not found",
      });
    }

    return res.status(200).json({
      message: "Provider profile updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// GET /api/providers/:id/availability
// Returns all 28 slots (7 days x 4 time-slots) with AVAILABLE / BOOKED status
const getProviderWeekAvailability = async (req, res) => {
  try {
    const providerId = req.params.id;

    // Use local time parts — avoids toISOString() UTC off-by-one (e.g. UTC+1 at 00:30 = yesterday UTC)
    const pad = (n) => String(n).padStart(2, "0");
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    });

    const [rows] = await pool.execute(
      `SELECT
          d.date_meeting,
          DAYNAME(d.date_meeting) AS day_name,
          s.time_slot,
          CASE
              WHEN b.id IS NOT NULL THEN 'BOOKED'
              ELSE 'AVAILABLE'
          END AS availability
       FROM
          (SELECT ? AS date_meeting UNION ALL SELECT ? UNION ALL SELECT ?
           UNION ALL SELECT ? UNION ALL SELECT ? UNION ALL SELECT ? UNION ALL SELECT ?) AS d
          CROSS JOIN (
            SELECT '08:00-12:00' AS time_slot UNION ALL
            SELECT '12:00-15:00'              UNION ALL
            SELECT '15:00-18:00'              UNION ALL
            SELECT '18:00-21:00'
          ) AS s
          LEFT JOIN bookings b
              ON  b.provider_id = ?
              AND b.date_meeting = d.date_meeting
              AND b.time_slot   = s.time_slot
              AND b.status NOT IN ('CANCELLED')
       ORDER BY d.date_meeting, s.time_slot`,
      [...dates, providerId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    // Group rows by date — read date parts directly to avoid any tz shift
    const grouped = {};
    for (const row of rows) {
      const rawDate = row.date_meeting;
      const key =
        typeof rawDate === "string"
          ? rawDate
          : `${rawDate.getFullYear()}-${pad(rawDate.getMonth() + 1)}-${pad(rawDate.getDate())}`;

      if (!grouped[key]) {
        grouped[key] = { date: key, day_name: row.day_name, slots: [] };
      }
      grouped[key].slots.push({
        time_slot: row.time_slot,
        availability: row.availability,
      });
    }

    res.json({
      success: true,
      provider_id: Number(providerId),
      week: Object.values(grouped),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProviders, getProviderById, updateProviderProfile, getProviderWeekAvailability };
