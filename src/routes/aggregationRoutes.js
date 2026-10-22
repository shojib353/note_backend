const express = require('express');
const router = express.Router();
const {
  getUsersByInterests,
  getUserPostsLookup,
} = require('../controllers/aggregationController');

/**
 * Scenario 1: Group by Interests
 * Uses exactly one collection.aggregate() call.
 */
router.get('/group-by-interests', getUsersByInterests);

/**
 * Scenario 2: User Posts ($lookup)
 * Single aggregation pipeline with a $lookup stage.
 */
router.get('/user-posts/:userId', getUserPostsLookup);

module.exports = router;
