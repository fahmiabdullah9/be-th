const Tour = require("../models/tourModel");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

exports.getTours = async (req, res) => {
  try {
    const tours = await Tour.findAll();

    const responseData = tours.map((tour) => {
      // Logic Slug URL
      const url = tour.title.toLowerCase().replace(/ /g, "-");

      // Logic Cover Image
      const coverImage =
        tour.raw_images.find((img) => img.is_cover == 1)?.image_url || null;

      // Logic Min Price (Ambil dari varian terkecil, jika tidak ada pakai price default)
      const minPrice =
        tour.raw_variants.length > 0
          ? Math.min(...tour.raw_variants.map((v) => v.price))
          : tour.price;

      return {
        id: tour.id,
        title: tour.title,
        url: url,
        coverImage: coverImage,
        minPrice: Number(minPrice),
        day: tour.day,
        night: tour.night,
        description: tour.description,
        location: tour.location,
        created_at: tour.created_at,
        updated_at: tour.updated_at,
      };
    });

    res.status(200).json({
      status: 200,
      message: "Tour get successfully",
      data: responseData,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getTourDetail = async (req, res) => {
  try {
    const { tourId } = req.query;
    const tour = await Tour.findById(tourId);

    if (!tour) {
      return res
        .status(404)
        .json({ status: false, message: "Data not found!" });
    }

    // Generate URL Slug
    const url = tour.title.toLowerCase().replace(/ /g, "-");

    // Cari coverImage (is_cover == 1 atau true)
    const coverImage =
      tour.raw_images.find((img) => img.is_cover == 1)?.image_url || null;

    // Hitung minPrice dari varian
    const minPrice =
      tour.raw_variants.length > 0
        ? Math.min(...tour.raw_variants.map((v) => v.price))
        : tour.price;

    const responseData = {
      id: tour.id,
      title: tour.title,
      url: url,
      coverImage: coverImage,
      minPrice: Number(minPrice),
      day: tour.day,
      night: tour.night,
      description: tour.description,
      location: tour.location,
      images: tour.raw_images.map((img) => ({
        id: img.id,
        imageUrl: img.image_url,
        idCover: img.is_cover === 1,
      })),
      variant: tour.raw_variants.map((v) => ({
        id: v.id,
        name: v.variant_name,
        price: Number(v.price),
      })),
      itinerery: tour.raw_itineraries.map((it) => ({
        id: it.id,
        dayNumber: it.day_number,
        activity: it.activity,
        description: it.description,
      })),
      include: tour.raw_includes.map((inc) => ({
        id: inc.id,
        content: inc.content,
      })),
      exclude: tour.raw_excludes.map((exc) => ({
        id: exc.id,
        content: exc.content,
      })),
      notes: tour.raw_notes.map((n) => ({
        id: n.id,
        content: n.content,
      })),
    };

    res.status(200).json({
      status: true,
      message: "Tour detail successfully",
      data: responseData,
    });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
};

exports.searchTour = async (req, res) => {
  try {
    const { title } = req.query;

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Query parameter 'title' is required",
      });
    }

    const tours = await Tour.findByTitle(title);

    res.status(200).json({
      status: 200,
      message:
        tours.length > 0
          ? "Tours found successfully"
          : "No tours match your search",
      data: tours,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.addTour = async (req, res) => {
  try {
    await Tour.create(req.body);
    res.status(200).json({
      status: true,
      message: "Tour created successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.addTourImages = async (req, res) => {
  try {
    const { tour_id, is_cover } = req.body;

    if (!req.file) {
      return res
        .status(400)
        .json({ status: false, message: "Pilih file gambar dulu!" });
    }

    // 1. Siapkan nama file baru (pakai .jpg)
    const fileName = `${Date.now()}.jpg`;
    const outputPath = path.join("public/uploads/", fileName);

    // 2. Gunakan Buffer agar file asli tidak terkunci (locked) oleh Sharp
    const imageBuffer = await sharp(req.file.path)
      .resize(1200)
      .jpeg({ quality: 80 })
      .toBuffer(); // Simpan ke memori dulu

    // 3. Tulis hasil buffer ke file tujuan
    fs.writeFileSync(outputPath, imageBuffer);

    // 4. Sekarang aman untuk hapus file asli hasil upload Multer
    // Tambahkan delay kecil atau gunakan try-catch untuk memastikan file tidak terkunci
    try {
      fs.unlinkSync(req.file.path);
    } catch (unlinkErr) {
      console.warn("Gagal menghapus file temporary:", unlinkErr.message);
      // Kita abaikan saja karena ini cuma file temp, yang penting proses utama sukses
    }

    // 5. Simpan ke database
    await Tour.createImage({
      tour_id,
      image_url: fileName,
      is_cover: is_cover || 0,
    });

    res.status(200).json({
      status: true,
      message: "Image added and converted successfully",
      data: { imageUrl: fileName },
    });
  } catch (err) {
    res.status(400).json({ status: false, message: err.message });
  }
};

exports.addTourVariant = async (req, res) => {
  try {
    await Tour.createVariant(req.body);
    res.status(200).json({
      status: true,
      message: "Variant added successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.addTourItinerery = async (req, res) => {
  try {
    await Tour.createItinerary(req.body);
    res.status(200).json({
      status: true,
      message: "Itinerary added successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.addTourInclude = async (req, res) => {
  try {
    await Tour.createInclude(req.body);
    res.status(200).json({
      status: true,
      message: "Include added successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.addTourExclude = async (req, res) => {
  try {
    await Tour.createExclude(req.body);
    res.status(200).json({
      status: true,
      message: "Exclude added successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.addTourNote = async (req, res) => {
  try {
    await Tour.createNote(req.body);
    res.status(200).json({
      status: true,
      message: "Note added successfully",
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const { id } = req.body;
    const tour = await Tour.findById(id);

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "ID is required in request body!",
      });
    }

    if (!tour) {
      return res.status(404).json({
        status: false,
        message: "Data not found!",
      });
    }

    await Tour.update(id, req.body);

    res.json({
      status: true,
      message: `Tour with ID ${id} updated successfully`,
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.body;
    const tour = await Tour.findById(id);

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "ID is required in request body!",
      });
    }

    if (!tour) {
      return res.status(404).json({
        status: false,
        message: "Data not found!",
      });
    }

    await Tour.delete(id);

    res.json({
      status: true,
      message: `Tour with ID ${id} deleted successfully`,
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
    });
  }
};
