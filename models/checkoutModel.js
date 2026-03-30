const db = require("../config/db");

const Checkout = {
  // Simpan data utama (Inquiry)
  createInquiry: async (data) => {
    const {
      booking_code,
      tour_id,
      full_name,
      email,
      phone,
      travel_date,
      total_price,
    } = data;
    const [result] = await db.query(
      `INSERT INTO checkouts (booking_code, tour_id, full_name, email, phone, travel_date, total_price, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        booking_code,
        tour_id,
        full_name,
        email,
        phone,
        travel_date,
        total_price,
      ],
    );
    return result.insertId;
  },

  // Simpan rincian item (Bulk Insert)
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

  // Ambil detail berdasarkan ID checkout
  getDetailById: async (id) => {
    // 1. Ambil data utama dari tabel checkouts
    const [checkout] = await db.query("SELECT * FROM checkouts WHERE id = ?", [
      id,
    ]);
    if (checkout.length === 0) return null;

    // 2. Ambil rincian item-itemnya + Nama Varian dari tabel sebelah
    const [items] = await db.query(
      `SELECT ci.*, tv.variant_name as variant_name 
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
