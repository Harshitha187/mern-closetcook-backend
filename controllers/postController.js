import Post from '../models/postModel.js';
import User from '../models/usermodels.js';
import cloudinary from '../config/cloudinary.js';

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { description, tags } = req.body;
    const userId = req.userId;

    if (!description) {
      return res.json({ success: false, message: 'Description is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: 'At least one image is required' });
    }

    // Upload images to cloudinary
    const imageUrls = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'closetcook/posts',
        resource_type: 'image'
      });
      imageUrls.push(result.secure_url);
    }

    // Create new post
    const newPost = new Post({
      user: userId,
      images: imageUrls,
      description,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await newPost.save();

    // Update user's post count
    await User.findByIdAndUpdate(userId, { $inc: { postCount: 1 } });

    // Populate user data for response
    await newPost.populate('user', 'name profilePicture');

    res.json({ success: true, message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Create post error:', error);
    res.json({ success: false, message: 'Error creating post' });
  }
};

// Get all posts (feed)
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('user', 'name profilePicture')
      .populate('stitches.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.json({ success: false, message: 'Error fetching posts' });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: userId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.json({ success: false, message: 'Error fetching user posts' });
  }
};

// Get posts by date
export const getPostsByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.userId;

    if (!date) {
      return res.json({ success: false, message: 'Date is required' });
    }

    // Parse the date and create start/end of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const posts = await Post.find({
      user: userId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('user', 'name profilePicture')
    .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get posts by date error:', error);
    res.json({ success: false, message: 'Error fetching posts by date' });
  }
};

// Toggle stitch (like/unlike)
export const toggleStitch = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.json({ success: false, message: 'Post not found' });
    }

    // Check if user already stitched
    const existingStitchIndex = post.stitches.findIndex(
      stitch => stitch.user.toString() === userId
    );

    if (existingStitchIndex > -1) {
      // Remove stitch
      post.stitches.splice(existingStitchIndex, 1);
      post.stitchCount = Math.max(0, post.stitchCount - 1);
    } else {
      // Add stitch
      post.stitches.push({ user: userId });
      post.stitchCount += 1;
    }

    await post.save();

    res.json({ 
      success: true, 
      message: existingStitchIndex > -1 ? 'Stitch removed' : 'Stitched successfully',
      stitchCount: post.stitchCount,
      isStitched: existingStitchIndex === -1
    });
  } catch (error) {
    console.error('Toggle stitch error:', error);
    res.json({ success: false, message: 'Error updating stitch' });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const post = await Post.findOne({ _id: postId, user: userId });
    if (!post) {
      return res.json({ success: false, message: 'Post not found or unauthorized' });
    }

    // Delete images from cloudinary
    for (const imageUrl of post.images) {
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`closetcook/posts/${publicId}`);
    }

    await Post.findByIdAndDelete(postId);

    // Update user's post count
    await User.findByIdAndUpdate(userId, { $inc: { postCount: -1 } });

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.json({ success: false, message: 'Error deleting post' });
  }
};
