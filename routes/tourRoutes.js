const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");

// TAMBAHKAN BARIS INI:
const multer = require("multer");
const path = require("path");

// Baru setelah itu konfigurasi storage kamu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage: storage });

// API Tour
router.get("/TourList", tourController.getTours);
router.get("/TourDetail", tourController.getTourDetail);
router.get("/TourSearch", tourController.searchTour);
router.post("/TourCreate", tourController.addTour);
router.post("/TourUpdate", tourController.updateTour);
router.post("/TourDelete", tourController.deleteTour);

// Add Tour List
// router.post("/TourAddImages", tourController.addTourImages);
router.post(
  "/TourAddImages",
  upload.single("img"),
  tourController.addTourImages,
);
router.post("/TourAddVariant", tourController.addTourVariant);
router.post("/TourAddItinerery", tourController.addTourItinerery);
router.post("/TourAddInclude", tourController.addTourInclude);
router.post("/TourAddExclude", tourController.addTourExclude);
router.post("/TourAddNote", tourController.addTourNote);

module.exports = router;
