const mongoose = require('mongoose');
const slugify = require('slugify');

const newsSchema = new mongoose.Schema({
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
  excerpt: {
    type: String,
    required: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['news', 'event', 'announcement', 'press-release'],
    default: 'news'
  },
  category: {
    type: String,
    required: true,
    enum: ['company-news', 'partnership', 'awards', 'research', 'events', 'product-launch']
  },
  author: {
    name: {
      type: String,
      required: true
    },
    email: String
  },
  featuredImage: String,
  images: [String],
  eventDetails: {
    date: Date,
    time: String,
    location: String,
    registrationUrl: String
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  tags: [String],
  isHighlighted: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate slug before saving
newsSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Index for search
newsSchema.index({ title: 'text', excerpt: 'text', content: 'text' });
newsSchema.index({ slug: 1 });
newsSchema.index({ type: 1 });
newsSchema.index({ category: 1 });
newsSchema.index({ status: 1 });
newsSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);
