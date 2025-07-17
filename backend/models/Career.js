const mongoose = require('mongoose');
const slugify = require('slugify');

const careerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  department: {
    type: String,
    required: true,
    enum: ['engineering', 'design', 'sales', 'marketing', 'hr', 'operations', 'security', 'infrastructure']
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  experience: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [String],
  responsibilities: [String],
  benefits: [String],
  skills: [String],
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicationDeadline: Date,
  contactEmail: String,
  applicationsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate slug before saving
careerSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Index for search
careerSchema.index({ title: 'text', description: 'text', skills: 'text' });
careerSchema.index({ slug: 1 });
careerSchema.index({ department: 1 });
careerSchema.index({ type: 1 });
careerSchema.index({ experience: 1 });
careerSchema.index({ isActive: 1 });
careerSchema.index({ location: 1 });

module.exports = mongoose.model('Career', careerSchema);
