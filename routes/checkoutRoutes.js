const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/Inquiry", verifyToken, checkoutController.inquiry);
router.post("/Checkout", verifyToken, checkoutController.checkout);
router.get("/CheckoutDetail", verifyToken, checkoutController.getDetail);

module.exports = router;
