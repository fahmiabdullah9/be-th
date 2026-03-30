const db = require('../config/db');

const User = {
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  findByEmail: async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  findByRefreshToken: async (token) => {
    const [rows] = await db.query('SELECT * FROM users WHERE refresh_token = ?', [token]);
    return rows[0];
  },

  create: async (data) => {
    const { name, phone, email, password } = data;
    const [result] = await db.query(
      'INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)',
      [name, phone, email, password]
    );
    return result.insertId;
  },

  updateRefreshToken: async (id, token) => {
    return await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [token, id]);
  },

  updatePhoto: async (id, photoData) => {
    const [result] = await db.query(
      'UPDATE users SET photo_profile = ? WHERE id = ?', 
      [photoData, id]
    );
    return result;
  },

  findPhotoById: async (id) => {
    const [rows] = await db.query('SELECT photo_profile FROM users WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = User;