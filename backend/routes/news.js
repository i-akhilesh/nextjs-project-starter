const express = require('express');
const router = express.Router();
const News = require('../models/News');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/news/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// GET /api/news - List all news/events
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      status = 'published',
      search,
      sort = '-publishedAt'
    } = req.query;

    const query = {};
    
    // Add filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const news = await News.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content') // Exclude full content for list view
      .exec();

    const total = await News.countDocuments(query);

    res.json({
      success: true,
      data: news,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/news/events - Get upcoming events
router.get('/events', async (req, res) => {
  try {
    const upcomingEvents = await News.find({
      type: 'event',
      status: 'published',
      'eventDetails.date': { $gte: new Date() }
    })
    .sort({ 'eventDetails.date': 1 })
    .limit(10);

    res.json({
      success: true,
      data: upcomingEvents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/news/:id - Get single news/event by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let news = await News.findById(id);
    if (!news) {
      news = await News.findOne({ slug: id, status: 'published' });
    }
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News/Event not found'
      });
    }

    // Increment views
    news.views += 1;
    await news.save();

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/news - Create new news/event (Admin only)
router.post('/', upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const newsData = req.body;
    
    // Handle file uploads
    if (req.files) {
      if (req.files.featuredImage) {
        newsData.featuredImage = req.files.featuredImage[0].path;
      }
      if (req.files.images) {
        newsData.images = req.files.images.map(file => file.path);
      }
    }

    // Parse JSON fields if they're strings
    if (typeof newsData.author === 'string') {
      newsData.author = JSON.parse(newsData.author);
    }
    if (typeof newsData.eventDetails === 'string') {
      newsData.eventDetails = JSON.parse(newsData.eventDetails);
    }
    if (typeof newsData.tags === 'string') {
      newsData.tags = JSON.parse(newsData.tags);
    }

    const news = new News(newsData);
    await news.save();

    res.status(201).json({
      success: true,
      data: news,
      message: 'News/Event created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/news/:id - Update news/event (Admin only)
router.put('/:id', upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle file uploads
    if (req.files) {
      if (req.files.featuredImage) {
        updateData.featuredImage = req.files.featuredImage[0].path;
      }
      if (req.files.images) {
        updateData.images = req.files.images.map(file => file.path);
      }
    }

    // Parse JSON fields if they're strings
    if (typeof updateData.author === 'string') {
      updateData.author = JSON.parse(updateData.author);
    }
    if (typeof updateData.eventDetails === 'string') {
      updateData.eventDetails = JSON.parse(updateData.eventDetails);
    }
    if (typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }

    const news = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News/Event not found'
      });
    }

    res.json({
      success: true,
      data: news,
      message: 'News/Event updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/news/:id - Delete news/event (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await News.findByIdAndDelete(id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News/Event not found'
      });
    }

    res.json({
      success: true,
      message: 'News/Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
