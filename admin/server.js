const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'admin-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
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
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and videos are allowed.'));
    }
  }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Default admin credentials (change in production)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);

// Routes

// Login page
app.get('/login', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login POST
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    req.session.isAuthenticated = true;
    req.session.username = username;
    res.json({ success: true, redirect: '/dashboard' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, redirect: '/login' });
});

// Dashboard
app.get('/', requireAuth, (req, res) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Products management
app.get('/products', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

// Blogs management
app.get('/blogs', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blogs.html'));
});

// Events & News management
app.get('/events', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'events.html'));
});

// Careers management
app.get('/careers', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'careers.html'));
});

// Contact responses
app.get('/contacts', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contacts.html'));
});

// API proxy routes to backend
app.use('/api', requireAuth, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${API_BASE_URL}${req.path}`,
      data: req.body,
      params: req.query,
      headers: {
        'Content-Type': req.headers['content-type']
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || error.message
    });
  }
});

// File upload endpoint
app.post('/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  
  res.json({
    success: true,
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// Multiple file upload
app.post('/upload-multiple', requireAuth, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }
  
  const files = req.files.map(file => ({
    filename: file.filename,
    path: `/uploads/${file.filename}`,
    size: file.size,
    mimetype: file.mimetype
  }));
  
  res.json({
    success: true,
    files: files
  });
});

// Export contacts to CSV
app.get('/export/contacts', requireAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/contact`);
    const contacts = response.data.data;
    
    // Create CSV content
    const csvHeader = 'Name,Email,Subject,Message,Service,Date\n';
    const csvContent = contacts.map(contact => {
      return `"${contact.name}","${contact.email}","${contact.subject}","${contact.message.replace(/"/g, '""')}","${contact.service || 'N/A'}","${new Date(contact.createdAt).toLocaleDateString()}"`;
    }).join('\n');
    
    const csv = csvHeader + csvContent;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to export contacts' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Page not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Admin Panel running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
});

module.exports = app;
