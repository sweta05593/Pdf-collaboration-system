// models/PdfFile.js
import mongoose from 'mongoose';

const pdfFileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'Original name is required'],
    trim: true,
    maxlength: [255, 'Original name cannot exceed 255 characters']
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    unique: true,
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  shareToken: {
    type: String,
    required: [true, 'Share token is required'],
    unique: true,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  metadata: {
    pages: {
      type: Number,
      min: [0, 'Page count cannot be negative']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters']
    },
    author: {
      type: String,
      trim: true,
      maxlength: [255, 'Author cannot exceed 255 characters']
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [500, 'Subject cannot exceed 500 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
pdfFileSchema.index({ uploadedBy: 1, createdAt: -1 });
pdfFileSchema.index({ shareToken: 1 });
pdfFileSchema.index({ originalName: 'text' });
pdfFileSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual properties
pdfFileSchema.virtual('fileUrl').get(function() {
  if (!this.filename) return null;
  return `/uploads/${this.filename}`;
});

pdfFileSchema.virtual('shareUrl').get(function() {
  if (!this.shareToken) return null;
  return `/share/${this.shareToken}`;
});

// Instance methods with error handling
pdfFileSchema.methods.incrementDownload = async function() {
  try {
    this.downloadCount = (this.downloadCount || 0) + 1;
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to increment download count: ${error.message}`);
  }
};

pdfFileSchema.methods.togglePublic = async function() {
  try {
    this.isPublic = !this.isPublic;
    return await this.save();
  } catch (error) {
    throw new Error(`Failed to toggle public status: ${error.message}`);
  }
};

// Static methods for common queries
pdfFileSchema.statics.findByShareToken = async function(shareToken) {
  try {
    if (!shareToken) {
      throw new Error('Share token is required');
    }
    return await this.findOne({ shareToken }).populate('uploadedBy', 'name email');
  } catch (error) {
    throw new Error(`Failed to find PDF by share token: ${error.message}`);
  }
};

pdfFileSchema.statics.findByUser = async function(userId, options = {}) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;
    
    const query = this.find({ uploadedBy: userId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email');
    
    return await query;
  } catch (error) {
    throw new Error(`Failed to find PDFs by user: ${error.message}`);
  }
};

pdfFileSchema.statics.searchFiles = async function(searchTerm, userId = null, options = {}) {
  try {
    if (!searchTerm) {
      throw new Error('Search term is required');
    }
    
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    
    const searchQuery = {
      $text: { $search: searchTerm }
    };
    
    if (userId) {
      searchQuery.uploadedBy = userId;
    }
    
    return await this.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name email');
  } catch (error) {
    throw new Error(`Failed to search files: ${error.message}`);
  }
};

// Pre-save middleware for additional validation
pdfFileSchema.pre('save', function(next) {
  try {
    // Ensure filename has proper extension
    if (this.filename && !this.filename.toLowerCase().endsWith('.pdf')) {
      return next(new Error('Filename must have .pdf extension'));
    }
    
    // Validate file size (e.g., max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (this.fileSize > MAX_FILE_SIZE) {
      return next(new Error('File size exceeds maximum allowed size (50MB)'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Error handling for unique constraints
pdfFileSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.keyPattern?.filename) {
      next(new Error('A file with this name already exists'));
    } else if (error.keyPattern?.shareToken) {
      next(new Error('Share token conflict occurred'));
    } else {
      next(new Error('Duplicate entry error'));
    }
  } else {
    next(error);
  }
});

// Create and export the model
const PdfFile = mongoose.models.PdfFile || mongoose.model('PdfFile', pdfFileSchema);

export default PdfFile;