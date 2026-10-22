const Post = require('../models/Post');
const mongoose = require('mongoose');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the post',
      });
    }

    const post = await Post.create({
      title,
      content,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all public posts with pagination
 * @route   GET /api/posts
 * @access  Public
 * 
 * Index support:
 * - Query sorted by createdAt supported by index: { createdAt: -1 } on Post
 */
const getPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [posts, totalCount] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email role'),
      Post.countDocuments(),
    ]);

    const response = formatPaginatedResponse({
      data: posts,
      totalCount,
      page,
      limit,
    });

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Retrieve all posts belonging to a particular user using $lookup aggregation
 * @route   GET /api/posts/user/:userId
 * @access  Public
 * 
 * Constraint: Use a single aggregation pipeline with a $lookup stage.
 * Supported by: postSchema.index({ author: 1, createdAt: -1 })
 */
const getPostsByUserLookup = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const targetUserId = new mongoose.Types.ObjectId(userId);

    // Single aggregation pipeline with $lookup from Posts to Users
    const posts = await Post.aggregate([
      // Match posts belonging to the user (Supported by index { author: 1, createdAt: -1 })
      { $match: { author: targetUserId } },

      // Single aggregation pipeline with a $lookup stage
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorDetails',
        },
      },

      // Unwind the populated author details array
      {
        $unwind: {
          path: '$authorDetails',
          preserveNullAndEmptyArrays: true,
        },
      },

      // Sort by newest first
      { $sort: { createdAt: -1 } },

      // Project clean structure
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: '$authorDetails._id',
            name: '$authorDetails.name',
            email: '$authorDetails.email',
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostsByUserLookup,
};
