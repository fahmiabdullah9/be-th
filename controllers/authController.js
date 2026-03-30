const User = require("../models/userModel");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const hashedPassword = CryptoJS.SHA256(password).toString();

    await User.create({ name, phone, email, password: hashedPassword });

    res.status(201).json({
      status: true,
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user || user.password !== CryptoJS.SHA256(password).toString()) {
      return res.status(401).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "60m" },
    );

    // Create Refresh Token (Long-lived: 7 days)
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    // Save Refresh Token to Database
    await User.updateRefreshToken(user.id, refreshToken);

    res.json({
      status: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      //   user: { id: user.id, name: user.name, role: user.role_id }
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token)
      return res.status(401).json({
        status: false,
        message: "Refresh token is required",
      });

    const user = await User.findByRefreshToken(token);
    if (!user)
      return res.status(403).json({
        status: false,
        message: "Invalid refresh token",
      });

    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err)
        return res.status(403).json({
          status: false,
          message: "Refresh token expired",
        });

      const newAccessToken = jwt.sign(
        { id: user.id, role: user.role_id },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );

      res.json({
        status: true,
        accessToken: newAccessToken,
      });
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findByRefreshToken(token);

    if (user) {
      // Clear refresh token in database
      await User.updateRefreshToken(user.id, null);
    }

    res.json({
      status: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
