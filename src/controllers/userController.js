const User = require('../models/User');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * @desc    List all users with pagination (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 * 
 * Index support:
 * - Query sorted by createdAt is supported by index: { createdAt: -1 } on User
 */
const listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [users, totalCount] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    const response = formatPaginatedResponse({
      data: users,
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
 * @desc    Get user profile by ID (Admin or Self)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 * 
 * Index support:
 * - Query by _id supported by default primary index { _id: 1 }
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add new user (Admin only)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Supported by index: { email: 1 } (unique)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const sanitizedInterests = Array.isArray(interests)
      ? interests.map((i) => String(i).trim().toLowerCase()).filter(Boolean)
      : typeof interests === 'string'
      ? interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean)
      : [];

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      interests: sanitizedInterests,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a user (Admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { name, email, role, interests, password } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (password) user.password = password; // pre-save will rehash if changed
    if (interests !== undefined) {
      user.interests = Array.isArray(interests)
        ? interests.map((i) => String(i).trim().toLowerCase()).filter(Boolean)
        : typeof interests === 'string'
        ? interests.split(',').map((i) => i.trim().toLowerCase()).filter(Boolean)
        : [];
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
