const express = require('express');
const router = express.Router();
const {
  createPost,
  getPosts,
  getPostsByUserLookup,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

// Public route to list posts with pagination
router.get('/', getPosts);

// Authenticated route to create post
router.post('/', protect, createPost);

// Scenario 2: Retrieve all posts belonging to a particular user via $lookup
router.get('/user/:userId', getPostsByUserLookup);

module.exports = router;
