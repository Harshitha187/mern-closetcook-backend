import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  images: [{
    type: String,
    required: true,
  }],
  description: {
    type: String,
    required: true,
  },
  tags: [{
    type: String,
  }],
  stitches: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }],
  stitchCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Index for better performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
