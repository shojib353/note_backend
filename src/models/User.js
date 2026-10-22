const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    interests: {
      type: [String],
      default: [],
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
 1. { email: 1 } (Unique):
    Supports GET / Read user by email during authentication/login:
    User.findOne({ email }).
 
 2. { createdAt: -1 }:
    Supports Admin listing all users with pagination sorted by creation time:
    User.find().sort({ createdAt: -1 }).skip(...).limit(...).
 
 3. { interests: 1 }:
    Multikey index to support Scenario 1: Group by Interests aggregation pipeline.
 =========================================================================
*/
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ interests: 1 });

// Password hashing middleware before saving user document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Exclude password from JSON output
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
