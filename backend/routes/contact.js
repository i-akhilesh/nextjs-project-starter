const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Configure nodemailer (you'll need to set up email credentials)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const contactData = req.body;
    
    // Add metadata
    contactData.ipAddress = req.ip || req.connection.remoteAddress;
    contactData.userAgent = req.get('User-Agent');
    
    // Create contact record
    const contact = new Contact(contactData);
    await contact.save();

    // Send notification email to admin
    if (process.env.ADMIN_EMAIL) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `New Contact Form Submission: ${contactData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
            <p><strong>Service Interest:</strong> ${contactData.service || 'Not specified'}</p>
            <p><strong>Company:</strong> ${contactData.company || 'Not specified'}</p>
            <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
            <p><strong>Newsletter:</strong> ${contactData.newsletter ? 'Yes' : 'No'}</p>
            <p><strong>Message:</strong></p>
            <p>${contactData.message}</p>
            <hr>
            <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
            <p><small>IP Address: ${contactData.ipAddress}</small></p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    }

    // Send auto-reply to user
    if (contactData.email) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: contactData.email,
          subject: 'Thank you for contacting Nextgen Digi Lab',
          html: `
            <h2>Thank you for your message!</h2>
            <p>Dear ${contactData.name},</p>
            <p>We have received your message and will get back to you within 24 hours.</p>
            <p><strong>Your message:</strong></p>
            <p><em>"${contactData.subject}"</em></p>
            <p>Best regards,<br>Nextgen Digi Lab Team</p>
            <hr>
            <p><small>This is an automated response. Please do not reply to this email.</small></p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send auto-reply email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: {
        id: contact._id,
        status: contact.status
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/contact - List all contact submissions (Admin only)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      service,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = {};
    
    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (service) query.service = service;
    if (search) {
      query.$text = { $search: search };
    }

    const contacts = await Contact.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-userAgent -ipAddress') // Exclude sensitive data
      .exec();

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: contacts,
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

// GET /api/contact/:id - Get single contact submission (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findById(id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/contact/:id - Update contact submission status (Admin only)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const contact = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      data: contact,
      message: 'Contact submission updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/contact/:id/notes - Add note to contact submission (Admin only)
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, addedBy } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Note content is required'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            content,
            addedBy: addedBy || 'Admin',
            addedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      data: contact,
      message: 'Note added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/contact/:id - Delete contact submission (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact submission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/contact/stats/summary - Get contact statistics (Admin only)
router.get('/stats/summary', async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const newContacts = await Contact.countDocuments({ status: 'new' });
    const inProgressContacts = await Contact.countDocuments({ status: 'in-progress' });
    const resolvedContacts = await Contact.countDocuments({ status: 'resolved' });
    
    const serviceInterests = await Contact.aggregate([
      { $match: { service: { $ne: '' } } },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalContacts,
        new: newContacts,
        inProgress: inProgressContacts,
        resolved: resolvedContacts,
        serviceInterests
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
