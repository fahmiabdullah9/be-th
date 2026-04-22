const { Queue } = require("bullmq");

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
};

const emailQueue = new Queue("email-queue", { connection });

console.log("🚀 [Queue] email-queue berhasil dibuat!");

module.exports = { emailQueue };
