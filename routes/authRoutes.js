const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/Login", authController.login);
router.post("/Register", authController.register);
router.post("/Logout", authController.logout);
router.post("/RefreshToken", authController.refreshToken);

module.exports = router;
