const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const verifyToken = require("../middleware/authMiddleware");
const multer = require("multer");

// Simpan di memori untuk diproses Sharp
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Batas upload 5MB
});

router.get("/ProfileDetail", verifyToken, profileController.getProfile);
router.post(
  "/ChangePhotoProfile",
  verifyToken,
  upload.single("image"),
  profileController.changePhotoProfile,
);
router.get("/PhotoProfile", verifyToken, profileController.getPhotoProfile);

module.exports = router;
