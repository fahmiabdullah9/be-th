const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

const tourRoutes = require("./routes/tourRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");

// Cors
const urlStatus = "dev";
let whitelist = [];

if (urlStatus === "prod") {
  whitelist = [process.env.FRONTEND_PROD];
} else {
  whitelist = [process.env.FRONTEND_DEV];
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Akses ditolak oleh kebijakan CORS TripHive!"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/Web", [authRoutes, profileRoutes, tourRoutes, checkoutRoutes]);

// Run
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
