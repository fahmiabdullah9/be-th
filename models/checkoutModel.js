const db = require("../config/db");

const Checkout = {
  // models/checkoutModel.js
  createInquiry: async (data) => {
    const {
      booking_code,
      tour_id,
      user_id,
      travel_date,
      note,
      pickup_date,
      pickup_location,
      total_price,
    } = data;

    const [result] = await db.query(
      `INSERT INTO checkouts 
       (booking_code, tour_id, user_id, travel_date, note, pickup_date, pickup_location, total_price, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`, // Jumlah '?' dikurangi menjadi 8
      [
        booking_code,
        tour_id,
        user_id,
        travel_date,
        note,
        pickup_date,
        pickup_location,
        total_price,
      ],
    );

    return result.insertId;
  },

  addItems: async (checkoutId, items) => {
    const values = items.map((item) => [
      checkoutId,
      item.variant_id,
      item.qty,
      item.subtotal,
    ]);

    return await db.query(
      "INSERT INTO checkout_items (checkout_id, variant_id, qty, subtotal) VALUES ?",
      [values],
    );
  },

  // Cari booking berdasarkan kode
  getByCode: async (code) => {
    const [rows] = await db.query(
      "SELECT * FROM checkouts WHERE booking_code = ?",
      [code],
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Update status ke waiting_payment
  updateStatusToWaiting: async (code, paymentMethod) => {
    return await db.query(
      "UPDATE checkouts SET status = 'waiting_payment', payment_method = ? WHERE booking_code = ?",
      [paymentMethod, code],
    );
  },

  getDetailById: async (id) => {
    // Ambil data utama + join ke users untuk dapet info pemesan
    const [checkout] = await db.query(
      `SELECT c.*, u.full_name, u.email 
       FROM checkouts c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [id],
    );

    if (checkout.length === 0) return null;

    // Ambil list item + nama variant-nya
    const [items] = await db.query(
      `SELECT ci.*, tv.variant_name 
       FROM checkout_items ci
       JOIN tour_variants tv ON ci.variant_id = tv.id
       WHERE ci.checkout_id = ?`,
      [id],
    );

    return {
      ...checkout[0],
      items: items,
    };
  },
};

module.exports = Checkout;
