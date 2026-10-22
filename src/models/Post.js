const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a post title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide post content'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to an author'],
    },
  },
  {
    timestamps: true,
  }
);

/*
 =========================================================================
 DATABASE INDEXING (Explicitly using schema.index as mandated)
 Strictly required indexes only - No unnecessary indexes:
 =========================================================================
 1. { author: 1, createdAt: -1 }:
    Supports:
    - Scenario 2: $lookup stage matching foreignField 'author' in Posts collection.
    - Retrieving a user's posts sorted by newest first.
 
 2. { createdAt: -1 }:
    Supports:
    - Public posts feed listing with pagination sorted by newest first:
      Post.find().sort({ createdAt: -1 }).skip(...).limit(...)
 =========================================================================
*/
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
