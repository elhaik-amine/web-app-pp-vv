const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const User = {
  findById: async (id) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  findByEmail: async (email) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  create: async ({ name, email, password, role = 'user' }) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      return { id: result.insertId, name, email, role };
    } catch (error) {
      throw error;
    }
  },

  update: async (id, fields) => {
    try {
      if (fields.password) {
        const salt = await bcrypt.genSalt(10);
        fields.password = await bcrypt.hash(fields.password, salt);
      }
      const keys = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
      const values = [...Object.values(fields), id];
      await pool.execute(`UPDATE users SET ${keys} WHERE id = ?`, values);
      return User.findById(id);
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    } catch (error) {
      throw error;
    }
  },

  matchPassword: async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  },
};

module.exports = User;
