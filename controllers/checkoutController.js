const Checkout = require("../models/checkoutModel");
const db = require("../config/db"); // Dibutuhkan untuk ambil harga variant secara langsung

exports.inquiry = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: false, message: "User not authenticated" });
    }

    const userId = req.user.id;
    const { idTour, bookDate, prodNote, pickupDate, pickupLocation, prodList } =
      req.body;

    let totalAllPrice = 0;
    let itemsToSave = [];

    for (const item of prodList) {
      // CARI ID & HARGA berdasarkan NAMA VARIANT dan TOUR ID
      const [rows] = await db.query(
        "SELECT id, price FROM tour_variants WHERE variant_name = ? AND tour_id = ?",
        [item.prodVariant, idTour],
      );
      const variantData = rows[0];

      if (variantData) {
        const subtotal = Number(variantData.price) * item.prodQTY;
        totalAllPrice += subtotal;
        itemsToSave.push({
          variant_id: variantData.id,
          qty: item.prodQTY,
          subtotal: subtotal,
        });
      } else {
        // Optional: Beri peringatan jika nama variant tidak ditemukan
        return res.status(400).json({
          status: false,
          message: `Variant '${item.prodVariant}' tidak ditemukan untuk tour ini.`,
        });
      }
    }

    const bookingCode = `TH-${Math.floor(Date.now() / 1000)}`;

    const checkoutId = await Checkout.createInquiry({
      booking_code: bookingCode,
      tour_id: idTour,
      user_id: userId,
      // full_name: req.user.full_name || "fahmi",
      // email: req.user.email || "fahmiiabd@gmail.com",
      // phone: req.user.phone || "085117279220",
      travel_date: bookDate,
      note: prodNote,
      pickup_date: pickupDate,
      pickup_location: pickupLocation,
      total_price: totalAllPrice,
    });

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
