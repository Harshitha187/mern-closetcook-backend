import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500,
  },
  location: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  stylePreferences: [{
    type: String,
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followerCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  postCount: {
    type: Number,
    default: 0,
  },
  verifyOtp: {
    type: String,
    default: ''
  },
  verifyOtpExpireAt: {
    type: Number,
    default: 0
  },
  isAccountVerified: {
    type: Boolean,
    default: false
  },
  resetOtp: {
    type: String,
    default: ''
  },
  resetExpireAt: {
    type: Number,
    default: 0
  },
}, {
  timestamps: true
});

const User = mongoose.models.user || mongoose.model('User', userSchema);

export default User;
