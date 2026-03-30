const User = require('../models/userModel');
const sharp = require('sharp');

exports.getProfile = async (req, res) => {
  try {
    // req.user.id didapat dari hasil decode token di middleware
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ 
        status: false, 
        message: "User profile not found" 
      });
    }

    // Menghapus data sensitif sebelum dikirim ke client
    const { password, refresh_token, photo_profile, ...profileData } = user;

    res.status(200).json({
      status: true,
      message: "Profile Detail successfully",
      data: profileData
    });
  } catch (err) {
    res.status(500).json({ 
        status: false, 
        message: err.message
     });
  }
};

exports.changePhotoProfile = async (req, res) => {
  try {
    // 1. Cek apakah ada file yang diupload (dari multer)
    if (!req.file) {
      return res.status(400).json({ 
        status: false, 
        message: "Please upload an image file" 
      });
    }

    // 2. Proses Kompresi & Convert ke Base64 menggunakan Sharp
    const compressedBuffer = await sharp(req.file.buffer)
      .resize(300, 300)
      .jpeg({ quality: 60 })
      .toBuffer();

    // 3. Tambahkan prefix header Base64
    const base64String = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

    await User.updatePhoto(req.user.id, base64String);

    res.status(200).json({
      status: true,
      message: "Photo profile updated successfullly",
      data: {
        photo_profile: base64String
      }
    });

  } catch (err) {
    res.status(500).json({ 
        status: false, 
        message: err.message 
    });
  }
};

exports.getPhotoProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findPhotoById(userId);

    if (!user) {
      return res.status(404).json({ 
        status: false, 
        message: "User not found" 
      });
    }

    if (!user.photo_profile) {
      return res.status(404).json({ 
        status: false, 
        message: "This user hasn't uploaded a photo yet" 
      });
    }

    res.json({
      status: true,
      message: "Success fetch photo profile",
      data: {
        id: userId,
        photo_profile: user.photo_profile
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};