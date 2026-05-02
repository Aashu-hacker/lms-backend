// ==============================|| controllers/userController.js ||============================== //

const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ==============================
// CREATE USER
// ==============================
// ⚠️ WARNING:
// Storing plain-text passwords is highly insecure.
// Better approach: store hashed password for login + separate plain password field ONLY if absolutely required for admin display.
// Recommended field in schema:
// plainPassword: String

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      affiliation,
      address,
      country,
      phone,
      role
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Name, Email, Password and Role are required'
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Hash password for authentication
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // Secure login password
      plainPassword: password, // Admin visible password
      affiliation,
      address,
      country,
      phone,
      role
    });

    // Response for admin panel
    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plainPassword: user.plainPassword,
        affiliation: user.affiliation,
        address: user.address,
        country: user.country,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to create user'
    });
  }
};

// ==============================
// GET ALL USERS
// ==============================
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch users'
    });
  }
};

// ==============================
// GET SINGLE USER
// ==============================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to fetch user'
    });
  }
};

// ==============================
// UPDATE USER
// ==============================
exports.updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      affiliation,
      address,
      country,
      phone,
      role
    } = req.body;

    // Check duplicate email
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.params.id }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Email already in use by another user'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        affiliation,
        address,
        country,
        phone,
        role
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to update user'
    });
  }
};

// ==============================
// DELETE USER
// ==============================
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Failed to delete user'
    });
  }
};