const Checkout = require("../models/checkoutModel");
const db = require("../config/db"); // Dibutuhkan untuk ambil harga variant secara langsung

// --- API INQUIRY ---
exports.inquiry = async (req, res) => {
  try {
    const { tour_id, full_name, email, phone, travel_date, items } = req.body;
    let totalAllPrice = 0;
    let itemsToSave = [];

    // 1. Hitung total harga dengan mengambil harga asli dari DB
    for (const v of items) {
      // Kita ambil harga langsung dari tabel tour_variants
      const [rows] = await db.query(
        "SELECT price FROM tour_variants WHERE id = ?",
        [v.variant_id],
      );
      const variantData = rows[0];

      if (variantData) {
        const subtotal = Number(variantData.price) * v.qty;
        totalAllPrice += subtotal;
        itemsToSave.push({
          variant_id: v.variant_id,
          qty: v.qty,
          subtotal: subtotal,
        });
      }
    }

    // 2. Generate Booking Code (TRP + Timestamp)
    const bookingCode = `TH-${Math.floor(Date.now() / 1000)}`;

    // 3. Simpan data utama ke tabel 'checkouts' lewat Model
    const checkoutId = await Checkout.createInquiry({
      booking_code: bookingCode,
      tour_id,
      full_name,
      email,
      phone,
      travel_date,
      total_price: totalAllPrice,
    });

    // 4. Simpan rincian ke tabel 'checkout_items' lewat Model
    await Checkout.addItems(checkoutId, itemsToSave);

    res.status(200).json({
      status: true,
      message: "Inquiry successfully",
      data: {
        booking_code: bookingCode,
        total_payment: totalAllPrice,
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

// --- API CHECKOUT ---
exports.checkout = async (req, res) => {
  try {
    const { booking_code, payment_method } = req.body;

    // 1. Cari data booking berdasarkan kode via Model
    const booking = await Checkout.getByCode(booking_code);
    if (!booking) {
      return res
        .status(404)
        .json({ status: false, message: "Booking code not found" });
    }

    // 2. Validasi agar tidak double checkout
    if (booking.status !== "pending") {
      return res.status(400).json({
        status: false,
        message: "This booking is already in status " + booking.status,
      });
    }

    // 3. Update status ke 'waiting_payment' via Model
    await Checkout.updateStatusToWaiting(booking_code, payment_method);

    res.status(200).json({
      status: true,
      message: "Checkout successfully",
      data: {
        booking_code,
        total_payment: Number(booking.total_price),
        payment_method,
        payment_details: {
          bank: "BCA",
          number: "1234567890",
          name: "PT TripHive Indonesia",
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.getDetail = async (req, res) => {
  try {
    // Ambil dari ?checkoutId=...
    const id = req.query.checkoutId;

    if (!id) {
      return res
        .status(400)
        .json({ status: false, message: "Parameter checkoutId is required" });
    }

    const detail = await Checkout.getDetailById(id);

    if (!detail) {
      return res.status(404).json({ status: false, message: "Data not found" });
    }

    res.status(200).json({
      status: true,
      data: {
        id: detail.id,
        booking_code: detail.booking_code,
        customer: {
          full_name: detail.full_name,
          email: detail.email,
          phone: detail.phone,
        },
        tour_info: {
          tour_id: detail.tour_id,
          travel_date: detail.travel_date,
          status: detail.status,
          payment_method: detail.payment_method,
          // Pastikan total_payment keluar sebagai Number murni
          total_payment: Number(detail.total_price),
        },
        items: detail.items.map((item) => ({
          variant_name: item.variant_name,
          qty: item.qty,
          subtotal: Number(item.subtotal),
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};
