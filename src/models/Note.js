const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a note title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide note content'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must belong to an author'],
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
    Compound index (Equality, Sort) to support:
    User listing their own notes with pagination ordered by newest first:
    Note.find({ author: userId }).sort({ createdAt: -1 }).skip(...).limit(...)
    
 2. { createdAt: -1 }:
    Supports:
    Admin listing all users' notes with pagination ordered by newest first:
    Note.find().sort({ createdAt: -1 }).skip(...).limit(...)
 =========================================================================
*/
noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
