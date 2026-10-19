/**
 * User Model
 * 
 * Stores user profile and hashed credentials.
 * Ensures email normalization, lowercase unique indexing, and safe serialization.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Do not return passwordHash in standard queries
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compares candidate password against the stored bcrypt hash
 * @param {string} candidatePassword 
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Static helper to hash passwords safely
 * @param {string} password 
 * @returns {Promise<string>}
 */
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Returns safe user object excluding sensitive internal fields
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
