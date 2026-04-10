const { pool } = require('../config/db');

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM service_categories WHERE is_active = 1 ORDER BY name ASC'
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/categories  (ADMIN)
const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO service_categories (name, description, icon) VALUES (?, ?, ?)',
      [name, description || null, icon || null]
    );

    const [rows] = await pool.execute('SELECT * FROM service_categories WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, data: rows[0], message: 'Category created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/categories/:id  (ADMIN)
const updateCategory = async (req, res) => {
  try {
    const [cats] = await pool.execute('SELECT id FROM service_categories WHERE id = ?', [req.params.id]);
    if (cats.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, icon } = req.body;

    await pool.execute(
      'UPDATE service_categories SET name = ?, description = ?, icon = ? WHERE id = ?',
      [name, description || null, icon || null, req.params.id]
    );

    const [rows] = await pool.execute('SELECT * FROM service_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Category updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/categories/:id/toggle  (ADMIN)
const toggleCategory = async (req, res) => {
  try {
    const [cats] = await pool.execute(
      'SELECT id, is_active FROM service_categories WHERE id = ?',
      [req.params.id]
    );
    if (cats.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const newStatus = cats[0].is_active ? 0 : 1;
    await pool.execute('UPDATE service_categories SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({
      success: true,
      data: { id: parseInt(req.params.id), is_active: newStatus },
      message: `Category ${newStatus ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, toggleCategory };
