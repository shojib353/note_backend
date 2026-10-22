const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: verify JWT Bearer token and populate req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_secure_notes_2026'
    );

    // Look up user using standard _id index
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token verification failed or expired.',
      error: err.message,
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * e.g. authorize('admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource. Required: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
