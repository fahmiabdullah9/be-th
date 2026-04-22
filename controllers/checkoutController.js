const Checkout = require("../models/checkoutModel");
const db = require("../config/db"); // Dibutuhkan untuk ambil harga variant secara langsung
const { emailQueue } = require("../queues/emailQueue");

exports.checkout = async (req, res) => {
  try {
    const { booking_code, payment_method } = req.body;
    console.log("--- START CHECKOUT PROCESS ---");

    const booking = await Checkout.getByCode(booking_code);
    if (!booking) {
      return res
        .status(404)
        .json({ status: false, message: "Booking code not found" });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ status: false, message: "Booking already " + booking.status });
    }

    // Update status di database
    await Checkout.updateStatusToWaiting(booking_code, payment_method);

    const fullDetail = await Checkout.getDetailWithTour(booking.id);
    const totalQty = fullDetail.items.reduce((sum, item) => sum + item.qty, 0);

    const responseData = {
      booking_code: booking_code,
      total_payment: Number(booking.total_price),
      total_qty: totalQty,
      payment_details: {
        payment_method: payment_method,
        payment_bank: "BCA",
        payment_number: "1234567890",
        payment_name: "PT TripHive Indonesia",
      },
      tour_details: {
        title: fullDetail.title,
        location: fullDetail.location,
      },
    };

    // KIRIM KE ANTREAN EMAIL
    // Ambil email dari database booking atau dari data user yang sedang login
    // const userEmail = booking.email || (req.user ? req.user.email : null);

    // if (userEmail) {
    //   await emailQueue.add("send-invoice", {
    //     email: userEmail,
    //     booking_code: booking_code,
    //     data: responseData,
    //   });
    // }

    const testEmail = "fahmi.iklan02@gmail.com";
    console.log(`--- Menambah Job ke Queue untuk: ${testEmail} ---`);

    try {
      const job = await emailQueue.add("send-invoice", {
        email: testEmail, // Manual email
        booking_code: booking_code,
        data: responseData,
      });
      console.log(`✅ Job Berhasil Masuk Redis! ID: ${job.id}`);
    } catch (queueError) {
      console.error("❌ Gagal memasukkan ke antrean:", queueError.message);
    }

    res.status(200).json({
      status: true,
      message: "Checkout successfully",
      data: responseData,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

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
      // PERUBAHAN DI SINI: Cari berdasarkan prodVariantId (ID), bukan nama
      const [rows] = await db.query(
        "SELECT id, price FROM tour_variants WHERE id = ? AND tour_id = ?",
        [item.prodVariantId, idTour], // Menggunakan prodVariantId dari request body
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
        // Pesan error lebih akurat menggunakan ID
        return res.status(400).json({
          status: false,
          message: `Variant ID '${item.prodVariantId}' tidak ditemukan untuk tour ini.`,
        });
      }
    }

    const bookingCode = `TH-${Math.floor(Date.now() / 1000)}`;

    const checkoutId = await Checkout.createInquiry({
      booking_code: bookingCode,
      tour_id: idTour,
      user_id: userId,
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
