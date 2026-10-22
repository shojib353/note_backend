const Note = require('../models/Note');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    Create a new note
 * @route   POST /api/notes
 * @access  Private (User, Admin)
 */
const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and content for the note',
      });
    }

    const note = await Note.create({
      title,
      content,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get list of notes with pagination
 *          - Regular user: Only sees their own notes
 *          - Admin: Can view everyone's notes (or filter by author)
 * @route   GET /api/notes
 * @access  Private
 * 
 * Index support:
 * - When regular user queries { author: userId }.sort({ createdAt: -1 })
 *   -> Supported by compound index: { author: 1, createdAt: -1 }
 * - When admin queries {}.sort({ createdAt: -1 })
 *   -> Supported by index: { createdAt: -1 }
 */
const getNotes = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    let filter = {};

    if (req.user.role === 'admin') {
      // Admin can view everyone's notes, or optionally filter by specific author
      if (req.query.author) {
        filter.author = req.query.author;
      }
    } else {
      // Regular user can only view their own notes
      filter.author = req.user._id;
    }

    const [notes, totalCount] = await Promise.all([
      Note.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email role'),
      Note.countDocuments(filter),
    ]);

    const response = formatPaginatedResponse({
      data: notes,
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
 * @desc    Get single note by ID
 *          - Regular user: Only authorized if note belongs to them
 *          - Admin: Can view any note
 * @route   GET /api/notes/:id
 * @access  Private
 * 
 * Index support:
 * - Querying by _id is supported by MongoDB primary key index { _id: 1 }
 */
const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      'author',
      'name email role'
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Role check: Regular users can only access their own notes
    const isOwner = note.author._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only view your own notes',
      });
    }

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a note
 *          - Regular user can update their own note
 *          - Admin inherits capabilities and can update
 * @route   PUT /api/notes/:id
 * @access  Private
 */
const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Role check
    const isOwner = note.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only update your own notes',
      });
    }

    const { title, content } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    const updatedNote = await note.save();

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a note
 *          - Regular user can delete their own note
 *          - Admin can delete any note
 * @route   DELETE /api/notes/:id
 * @access  Private
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Role check
    const isOwner = note.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You can only delete your own notes',
      });
    }

    await note.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
