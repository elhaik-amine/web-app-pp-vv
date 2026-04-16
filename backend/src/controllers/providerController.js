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

  // Basic validation
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

module.exports = { getProviders, getProviderById, updateProviderProfile };
