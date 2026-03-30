const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");

// API Tour
router.get("/TourList", tourController.getTours);
router.get("/TourDetail", tourController.getTourDetail);
router.get("/TourSearch", tourController.searchTour);
router.post("/TourCreate", tourController.addTour);
router.post("/TourUpdate", tourController.updateTour);
router.post("/TourDelete", tourController.deleteTour);

// Add Tour List
router.post("/TourAddImages", tourController.addTourImages);
router.post("/TourAddVariant", tourController.addTourVariant);
router.post("/TourAddItinerery", tourController.addTourItinerery);
router.post("/TourAddInclude", tourController.addTourInclude);
router.post("/TourAddExclude", tourController.addTourExclude);
router.post("/TourAddNote", tourController.addTourNote);

module.exports = router;
