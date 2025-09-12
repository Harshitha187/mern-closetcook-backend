import express from 'express';
import userAuth from '../middleware/userauth.js';
import { uploadMultiple, uploadSingle, handleUploadError } from '../middleware/upload.js';
import {
  createPost,
  getAllPosts,
  getUserPosts,
  getPostsByDate,
  toggleStitch,
  deletePost
} from '../controllers/postController.js';

const postRouter = express.Router();

// Create new post
postRouter.post('/create', userAuth, uploadMultiple, handleUploadError, createPost);

// Get all posts (feed)
postRouter.get('/feed', userAuth, getAllPosts);

// Get user's posts
postRouter.get('/user/:userId', userAuth, getUserPosts);

// Get posts by date
postRouter.get('/date', userAuth, getPostsByDate);

// Toggle stitch (like/unlike)
postRouter.post('/stitch/:postId', userAuth, toggleStitch);

// Delete post
postRouter.delete('/:postId', userAuth, deletePost);

export default postRouter;
