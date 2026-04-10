const { pool } = require('../config/db');

// GET /api/offers  (public, with optional filters: category_id, provider_id, search)
const getOffers = async (req, res) => {
  try {
    const { category_id, provider_id, search } = req.query;

    let sql = `
      SELECT o.*, u.name AS provider_name, u.avatar AS provider_avatar,
             sc.name AS category_name
      FROM service_offers o
      JOIN users u ON u.id = o.provider_id
      JOIN service_categories sc ON sc.id = o.category_id
      WHERE o.is_active = 1
    `;
    const params = [];

    if (category_id) { sql += ' AND o.category_id = ?'; params.push(category_id); }
    if (provider_id) { sql += ' AND o.provider_id = ?'; params.push(provider_id); }
    if (search)      { sql += ' AND o.title LIKE ?'; params.push(`%${search}%`); }

    sql += ' ORDER BY o.created_at DESC';

    const [rows] = await pool.execute(sql, params);

    res.json({ success: true, data: rows, message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/offers/:id
const getOfferById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT o.*, u.name AS provider_name, u.avatar AS provider_avatar,
              sc.name AS category_name
       FROM service_offers o
       JOIN users u ON u.id = o.provider_id
       JOIN service_categories sc ON sc.id = o.category_id
       WHERE o.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    res.json({ success: true, data: rows[0], message: 'OK' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/offers  (PROVIDER only)
const createOffer = async (req, res) => {
  try {
    const { category_id, title, description, price, duration, location } = req.body;

    if (!category_id || !title || !price) {
      return res.status(400).json({ success: false, message: 'category_id, title and price are required' });
    }

    const images = Array.isArray(req.body.images) ? req.body.images : [];

    const [result] = await pool.execute(
      `INSERT INTO service_offers (provider_id, category_id, title, description, price, duration, location, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        category_id,
        title,
        description || null,
        price,
        duration || null,
        location || null,
        JSON.stringify(images),
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM service_offers WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, data: rows[0], message: 'Offer created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/offers/:id  (PROVIDER — own offer only)
const updateOffer = async (req, res) => {
  try {
    const [offers] = await pool.execute(
      'SELECT * FROM service_offers WHERE id = ? AND provider_id = ?',
      [req.params.id, req.user.id]
    );

    if (offers.length === 0) {
      return res.status(404).json({ success: false, message: 'Offer not found or not yours' });
    }

    const { category_id, title, description, price, duration, location } = req.body;
    const images = Array.isArray(req.body.images) && req.body.images.length > 0
      ? req.body.images
      : JSON.parse(offers[0].images || '[]');

    await pool.execute(
      `UPDATE service_offers
       SET category_id = ?, title = ?, description = ?, price = ?, duration = ?, location = ?, images = ?
       WHERE id = ?`,
      [
        category_id || offers[0].category_id,
        title || offers[0].title,
        description !== undefined ? description : offers[0].description,
        price || offers[0].price,
        duration !== undefined ? duration : offers[0].duration,
        location !== undefined ? location : offers[0].location,
        JSON.stringify(images),
        req.params.id,
      ]
    );

    const [rows] = await pool.execute('SELECT * FROM service_offers WHERE id = ?', [req.params.id]);

    res.json({ success: true, data: rows[0], message: 'Offer updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/offers/:id/toggle  (PROVIDER — own offer only)
const toggleOffer = async (req, res) => {
  try {
    const [offers] = await pool.execute(
      'SELECT id, is_active FROM service_offers WHERE id = ? AND provider_id = ?',
      [req.params.id, req.user.id]
    );

    if (offers.length === 0) {
      return res.status(404).json({ success: false, message: 'Offer not found or not yours' });
    }

    const newStatus = offers[0].is_active ? 0 : 1;
    await pool.execute('UPDATE service_offers SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({
      success: true,
      data: { id: parseInt(req.params.id), is_active: newStatus },
      message: `Offer ${newStatus ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getOffers, getOfferById, createOffer, updateOffer, toggleOffer };
