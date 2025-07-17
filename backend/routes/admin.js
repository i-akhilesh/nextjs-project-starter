const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded admin credentials (in production, use database)
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username !== adminUsername) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // In production, hash the password and compare
    const isValidPassword = password === adminPassword;
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: adminUsername, role: 'admin' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        username: adminUsername,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/dashboard - Dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Blog = require('../models/Blog');
    const News = require('../models/News');
    const Career = require('../models/Career');
    const Contact = require('../models/Contact');

    // Get counts
    const stats = {
      products: {
        total: await Product.countDocuments({ isActive: true }),
        available: await Product.countDocuments({ status: 'available', isActive: true }),
        upcoming: await Product.countDocuments({ status: 'upcoming', isActive: true })
      },
      blogs: {
        total: await Blog.countDocuments(),
        published: await Blog.countDocuments({ status: 'published' }),
        draft: await Blog.countDocuments({ status: 'draft' })
      },
      news: {
        total: await News.countDocuments(),
        published: await News.countDocuments({ status: 'published' }),
        events: await News.countDocuments({ type: 'event', status: 'published' })
      },
      careers: {
        total: await Career.countDocuments({ isActive: true }),
        byDepartment: await Career.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$department', count: { $sum: 1 } } }
        ])
      },
      contacts: {
        total: await Contact.countDocuments(),
        new: await Contact.countDocuments({ status: 'new' }),
        inProgress: await Contact.countDocuments({ status: 'in-progress' }),
        resolved: await Contact.countDocuments({ status: 'resolved' })
      }
    };

    // Recent activities
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject status createdAt');

    const recentBlogs = await Blog.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title author publishedAt views');

    res.json({
      success: true,
      data: {
        stats,
        recent: {
          contacts: recentContacts,
          blogs: recentBlogs
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/admin/verify - Verify admin token
router.get('/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

module.exports = router;
