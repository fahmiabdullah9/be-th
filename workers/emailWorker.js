const { Worker } = require("bullmq");
const { Resend } = require("resend");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const resend = new Resend(process.env.RESEND_API_KEY);

const worker = new Worker(
  "email-queue",
  async (job) => {
    if (job.name === "send-invoice") {
      const { email, booking_code, data } = job.data;

      console.log(`[Worker] Memproses email untuk booking: ${booking_code}`);

      try {
        await resend.emails.send({
          from: "TripHive <onboarding@resend.dev>", // Setelah verifikasi domain, ganti ke noreply@triphive.id
          to: email,
          subject: `Tagihan Pembayaran ${booking_code} - TripHive`,
          html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #334155;">
            <h2 style="color: #3b82f6;">Pesanan Berhasil Dibuat!</h2>
            <p>Halo, terima kasih telah memilih <strong>TripHive</strong>. Pesanan paket <strong>${data.tour_details.title}</strong> Anda sedang menunggu pembayaran.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <p><strong>Kode Booking:</strong> <span style="color: #1e293b;">${booking_code}</span></p>
              <p><strong>Total Tagihan:</strong> <span style="color: #ef4444; font-size: 18px; font-weight: bold;">Rp ${data.total_payment.toLocaleString("id-ID")}</span></p>
            </div>

            <h3 style="margin-top: 25px;">Instruksi Transfer ${data.payment_details.payment_bank}:</h3>
            <p style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
              Bank: <strong>${data.payment_details.payment_bank}</strong><br>
              Nomor Rekening: <strong>${data.payment_details.payment_number}</strong><br>
              Atas Nama: <strong>${data.payment_details.payment_name}</strong>
            </p>
            
            <p style="font-size: 12px; color: #64748b; margin-top: 30px;">
              Email ini dikirim otomatis oleh sistem TripHive. Mohon segera selesaikan pembayaran sesuai nominal di atas.
            </p>
          </div>
        `,
        });
        console.log(`[Worker] Berhasil kirim email ke ${email}`);
      } catch (error) {
        console.error("[Worker] Error Resend:", error);
        throw error; // BullMQ akan otomatis mencoba lagi (retry)
      }
    }
  },
  {
    connection: { host: process.env.REDIS_HOST || "127.0.0.1", port: 6379 },
  },
);
