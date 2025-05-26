// models/index.js
import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  }
}, {
  timestamps: true
});

// PDF File Schema
const pdfFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original name is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  }
}, {
  timestamps: true
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  pdfFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PdfFile',
    required: [true, 'PDF file reference is required']
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: false
  },
  guestName: {
    type: String,
    trim: true,
    maxlength: [50, 'Guest name cannot exceed 50 characters']
  }
}, {
  timestamps: true
});

// Account Schema for NextAuth
const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: String,
  provider: String,
  providerAccountId: String,
  refresh_token: String,
  access_token: String,
  expires_at: Number,
  token_type: String,
  scope: String,
  id_token: String,
  session_state: String
});

// Session Schema for NextAuth
const sessionSchema = new mongoose.Schema({
  sessionToken: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expires: {
    type: Date,
    required: true
  }
});

// Export models
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const PdfFile = mongoose.models.PdfFile || mongoose.model('PdfFile', pdfFileSchema);
export const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
export const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);