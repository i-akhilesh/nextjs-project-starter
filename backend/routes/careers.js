const express = require('express');
const router = express.Router();
const Career = require('../models/Career');

// GET /api/careers - List all active job openings
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      type,
      experience,
      location,
      remote,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = { isActive: true };
    
    // Add filters
    if (department) query.department = department;
    if (type) query.type = type;
    if (experience) query.experience = experience;
    if (location) query.location = new RegExp(location, 'i');
    if (remote !== undefined) query.isRemote = remote === 'true';
    if (search) {
      query.$text = { $search: search };
    }

    const careers = await Career.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Career.countDocuments(query);

    res.json({
      success: true,
      data: careers,
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

// GET /api/careers/:id - Get single job opening by ID or slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let career = await Career.findById(id);
    if (!career) {
      career = await Career.findOne({ slug: id, isActive: true });
    }
    
    if (!career) {
      return res.status(404).json({
        success: false,
        error: 'Job opening not found'
      });
    }

    res.json({
      success: true,
      data: career
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/careers - Create new job opening (Admin only)
router.post('/', async (req, res) => {
  try {
    const careerData = req.body;
    
    // Parse JSON fields if they're strings
    if (typeof careerData.requirements === 'string') {
      careerData.requirements = JSON.parse(careerData.requirements);
    }
    if (typeof careerData.responsibilities === 'string') {
      careerData.responsibilities = JSON.parse(careerData.responsibilities);
    }
    if (typeof careerData.benefits === 'string') {
      careerData.benefits = JSON.parse(careerData.benefits);
    }
    if (typeof careerData.skills === 'string') {
      careerData.skills = JSON.parse(careerData.skills);
    }
    if (typeof careerData.salary === 'string') {
      careerData.salary = JSON.parse(careerData.salary);
    }

    const career = new Career(careerData);
    await career.save();

    res.status(201).json({
      success: true,
      data: career,
      message: 'Job opening created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/careers/:id - Update job opening (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Parse JSON fields if they're strings
    if (typeof updateData.requirements === 'string') {
      updateData.requirements = JSON.parse(updateData.requirements);
    }
    if (typeof updateData.responsibilities === 'string') {
      updateData.responsibilities = JSON.parse(updateData.responsibilities);
    }
    if (typeof updateData.benefits === 'string') {
      updateData.benefits = JSON.parse(updateData.benefits);
    }
    if (typeof updateData.skills === 'string') {
      updateData.skills = JSON.parse(updateData.skills);
    }
    if (typeof updateData.salary === 'string') {
      updateData.salary = JSON.parse(updateData.salary);
    }

    const career = await Career.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!career) {
      return res.status(404).json({
        success: false,
        error: 'Job opening not found'
      });
    }

    res.json({
      success: true,
      data: career,
      message: 'Job opening updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/careers/:id - Delete job opening (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const career = await Career.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!career) {
      return res.status(404).json({
        success: false,
        error: 'Job opening not found'
      });
    }

    res.json({
      success: true,
      message: 'Job opening deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/careers/:id/apply - Apply for a job (increment application count)
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    
    const career = await Career.findByIdAndUpdate(
      id,
      { $inc: { applicationsCount: 1 } },
      { new: true }
    );

    if (!career) {
      return res.status(404).json({
        success: false,
        error: 'Job opening not found'
      });
    }

    res.json({
      success: true,
      data: { applicationsCount: career.applicationsCount },
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/careers/meta/departments - Get all departments
router.get('/meta/departments', async (req, res) => {
  try {
    const departments = await Career.distinct('department', { isActive: true });
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/careers/meta/locations - Get all locations
router.get('/meta/locations', async (req, res) => {
  try {
    const locations = await Career.distinct('location', { isActive: true });
    
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
