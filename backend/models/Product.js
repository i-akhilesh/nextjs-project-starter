const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
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
  shortDescription: {
    type: String,
    required: true,
    maxlength: 500
  },
  fullDescription: {
    type: String,
    required: true
  },
  features: [{
    title: String,
    description: String,
    icon: String
  }],
  keyBenefits: [{
    title: String,
    description: String
  }],
  technicalSpecs: {
    systemRequirements: [String],
    platformSupport: [String],
    performance: String,
    scalability: String
  },
  media: {
    thumbnail: String,
    images: [String],
    videos: [String],
    brochureUrl: String
  },
  status: {
    type: String,
    enum: ['available', 'upcoming', 'discontinued'],
    default: 'available'
  },
  category: {
    type: String,
    required: true,
    enum: ['enterprise', 'automation', 'security', 'analytics', 'cloud']
  },
  pricing: {
    model: {
      type: String,
      enum: ['subscription', 'one-time', 'custom', 'free']
    },
    startingPrice: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
  tags: [String],
  releaseDate: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  seoMeta: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  }
}, {
  timestamps: true
});

// Generate slug before saving
productSchema.pre('save', function(next) {
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
productSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
