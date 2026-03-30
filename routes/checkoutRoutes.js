const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");

router.post("/Inquiry", checkoutController.inquiry);
router.post("/Checkout", checkoutController.checkout);
router.get("/CheckoutDetail", checkoutController.getDetail);

module.exports = router;
