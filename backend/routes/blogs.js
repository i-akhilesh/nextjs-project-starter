const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/blogs/';
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

// GET /api/blogs - List all blogs
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status = 'published',
      search,
      featured,
      sort = '-publishedAt'
    } = req.query;

    const query = {};
    
    // Add filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (featured !== undefined) query.isFeatured = featured === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const blogs = await Blog.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content') // Exclude full content for list view
      .exec();

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      data: blogs,
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

// GET /api/blogs/featured - Get featured blog
router.get('/featured', async (req, res) => {
  try {
    const featuredBlog = await Blog.findOne({
      status: 'published',
      isFeatured: true
    }).sort('-publishedAt');

    if (!featuredBlog) {
      return res.status(404).json({
        success: false,
        error: 'No featured blog found'
      });
    }

    res.json({
      success: true,
      data: featuredBlog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/blogs/:id - Get single blog by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let blog = await Blog.findById(id);
    if (!blog) {
      blog = await Blog.findOne({ slug: id, status: 'published' });
    }
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/blogs - Create new blog (Admin only)
router.post('/', upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const blogData = req.body;
    
    // Handle file uploads
    if (req.files) {
      if (req.files.featuredImage) {
        blogData.featuredImage = req.files.featuredImage[0].path;
      }
      if (req.files.images) {
        blogData.images = req.files.images.map(file => file.path);
      }
    }

    // Parse JSON fields if they're strings
    if (typeof blogData.author === 'string') {
      blogData.author = JSON.parse(blogData.author);
    }
    if (typeof blogData.tags === 'string') {
      blogData.tags = JSON.parse(blogData.tags);
    }
    if (typeof blogData.seoMeta === 'string') {
      blogData.seoMeta = JSON.parse(blogData.seoMeta);
    }

    const blog = new Blog(blogData);
    await blog.save();

    res.status(201).json({
      success: true,
      data: blog,
      message: 'Blog created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/blogs/:id - Update blog (Admin only)
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
    if (typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }
    if (typeof updateData.seoMeta === 'string') {
      updateData.seoMeta = JSON.parse(updateData.seoMeta);
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: blog,
      message: 'Blog updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/blogs/:id - Delete blog (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/blogs/:id/like - Like a blog
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }

    res.json({
      success: true,
      data: { likes: blog.likes },
      message: 'Blog liked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/blogs/categories - Get all blog categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { status: 'published' });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/blogs/tags - Get all blog tags
router.get('/meta/tags', async (req, res) => {
  try {
    const tags = await Blog.distinct('tags', { status: 'published' });
    
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
