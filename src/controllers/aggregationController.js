const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

/**
 * =========================================================================
 * SCENARIO 1: Group by Interests
 * =========================================================================
 * Context: User profiles contain a list of interests (e.g., ['chess', 'reading']).
 * Task: Specific view to see users grouped by interests.
 * Constraint: You must use exactly one collection.aggregate() call.
 *             Do not use any other methods.
 * Supported by: userSchema.index({ interests: 1 })
 * =========================================================================
 * @route   GET /api/aggregations/group-by-interests
 * @access  Public / Authenticated
 */
const getUsersByInterests = async (req, res, next) => {
  try {
    // Constraint check: Exactly one collection.aggregate() call
    const results = await User.aggregate([
      // Deconstruct the interests array field to output a document for each element
      { $unwind: '$interests' },

      // Group documents by individual interest
      {
        $group: {
          _id: '$interests',
          userCount: { $sum: 1 },
          users: {
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              role: '$role',
            },
          },
        },
      },

      // Sort by popularity (highest count first), then alphabetically by interest
      {
        $sort: {
          userCount: -1,
          _id: 1,
        },
      },

      // Shape the final output
      {
        $project: {
          _id: 0,
          interest: '$_id',
          userCount: 1,
          users: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      scenario: 'Scenario 1: Group by Interests',
      constraint: 'Exactly one collection.aggregate() call',
      count: results.length,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * =========================================================================
 * SCENARIO 2: User Posts ($lookup)
 * =========================================================================
 * Context: Users can write posts which are stored in a separate Posts collection.
 *          These posts are visible to everyone.
 * Task: Retrieve all posts belonging to a particular user.
 * Constraint: Use a single aggregation pipeline with a $lookup stage.
 * Supported by: postSchema.index({ author: 1, createdAt: -1 })
 * =========================================================================
 * @route   GET /api/aggregations/user-posts/:userId
 * @access  Public / Authenticated
 */
const getUserPostsLookup = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const targetUserId = new mongoose.Types.ObjectId(userId);

    // Single aggregation pipeline starting from User with $lookup to Posts
    const results = await User.aggregate([
      // Match the specific user
      { $match: { _id: targetUserId } },

      // Single $lookup stage to retrieve posts belonging to this user
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'author',
          as: 'posts',
        },
      },

      // Project user info along with retrieved posts and total post count
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          interests: 1,
          totalPosts: { $size: '$posts' },
          posts: {
            $map: {
              input: '$posts',
              as: 'p',
              in: {
                _id: '$$p._id',
                title: '$$p.title',
                content: '$$p.content',
                createdAt: '$$p.createdAt',
              },
            },
          },
        },
      },
    ]);

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      scenario: 'Scenario 2: User Posts ($lookup)',
      constraint: 'Single aggregation pipeline with a $lookup stage',
      data: results[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsersByInterests,
  getUserPostsLookup,
};
