const db = require("../config/db");

const Tour = {
  findAll: async () => {
    const [rows] = await db.query("SELECT * FROM tours");

    const toursWithData = await Promise.all(
      rows.map(async (tour) => {
        // Gunakan destructuring [ [images], [variants] ]
        const [[images], [variants]] = await Promise.all([
          db.query(
            "SELECT image_url, is_cover FROM tour_images WHERE tour_id = ?",
            [tour.id],
          ),
          db.query("SELECT price FROM tour_variants WHERE tour_id = ?", [
            tour.id,
          ]),
        ]);

        return {
          ...tour,
          raw_images: images,
          raw_variants: variants,
        };
      }),
    );

    return toursWithData;
  },

  findById: async (id) => {
    // 1. Ambil data utama tour
    const [rows] = await db.query("SELECT * FROM tours WHERE id = ?", [id]);

    // Jika tidak ditemukan, langsung return null
    if (rows.length === 0) return null;

    const tour = rows[0];

    // 2. Jalankan semua query pendukung secara paralel
    const [
      [images],
      [variants],
      [itineraries],
      [includes],
      [excludes],
      [notes],
    ] = await Promise.all([
      db.query("SELECT * FROM tour_images WHERE tour_id = ?", [id]),
      db.query("SELECT * FROM tour_variants WHERE tour_id = ?", [id]),
      db.query("SELECT * FROM tour_itineraries WHERE tour_id = ?", [id]),
      db.query("SELECT * FROM tour_includes WHERE tour_id = ?", [id]),
      db.query("SELECT * FROM tour_excludes WHERE tour_id = ?", [id]),
      db.query("SELECT * FROM tour_notes WHERE tour_id = ?", [id]),
    ]);

    const tourWithData = {
      ...tour,
      raw_images: images,
      raw_variants: variants,
      raw_itineraries: itineraries,
      raw_includes: includes,
      raw_excludes: excludes,
      raw_notes: notes,
    };

    return tourWithData;
  },

  findByTitle: async (title) => {
    const [rows] = await db.query("SELECT * FROM tours WHERE title LIKE ?", [
      `%${title}%`,
    ]);
    return rows;
  },

  create: async (data) => {
    const { title, day, night, description, location } = data;
    const [result] = await db.query(
      "INSERT INTO tours (title, day, night, description, location) VALUES (?, ?, ?, ?, ?)",
      [title, day, night, description, location],
    );
    return result.insertId;
  },

  createImage: async (data) => {
    const { tour_id, image_url, is_cover } = data;
    const [result] = await db.query(
      "INSERT INTO tour_images (tour_id, image_url, is_cover) VALUES (?, ?, ?)",
      [tour_id, image_url, is_cover || 0],
    );
    return result.insertId;
  },

  // Tambah Variant
  createVariant: async (data) => {
    const { tour_id, variant_name, price } = data;
    const [result] = await db.query(
      "INSERT INTO tour_variants (tour_id, variant_name, price) VALUES (?, ?, ?)",
      [tour_id, variant_name, price],
    );
    return result.insertId;
  },

  // Tambah Itinerary
  createItinerary: async (data) => {
    const { tour_id, day_number, activity, description } = data;
    const [result] = await db.query(
      "INSERT INTO tour_itineraries (tour_id, day_number, activity, description) VALUES (?, ?, ?, ?)",
      [tour_id, day_number, activity, description],
    );
    return result.insertId;
  },

  // Tambah Include
  createInclude: async (data) => {
    const { tour_id, content } = data;
    const [result] = await db.query(
      "INSERT INTO tour_includes (tour_id, content) VALUES (?, ?)",
      [tour_id, content],
    );
    return result.insertId;
  },

  // Tambah Exclude
  createExclude: async (data) => {
    const { tour_id, content } = data;
    const [result] = await db.query(
      "INSERT INTO tour_excludes (tour_id, content) VALUES (?, ?)",
      [tour_id, content],
    );
    return result.insertId;
  },

  // Tambah Notes
  createNote: async (data) => {
    const { tour_id, content } = data;
    const [result] = await db.query(
      "INSERT INTO tour_notes (tour_id, content) VALUES (?, ?)",
      [tour_id, content],
    );
    return result.insertId;
  },

  update: async (id, data) => {
    // Kita bongkar data dari body (data adalah req.body yang dikirim controller)
    const { title, description, location } = data;

    // Jalankan query UPDATE berdasarkan ID
    const [result] = await db.query(
      "UPDATE tours SET title=?, description=?, location=? WHERE id=?",
      [title, description, location, id],
    );

    return result;
  },

  delete: async (id) => {
    return await db.query("DELETE FROM tours WHERE id = ?", [id]);
  },
};

module.exports = Tour;
