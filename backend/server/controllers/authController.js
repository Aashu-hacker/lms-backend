// ==============================|| controllers/authController.js ||============================== //

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const validator = require('validator');


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid password'
      });
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error'
    });
  }
};

// ==============================
// REGISTER ADMIN
// ==============================

/**
 * =========================================
 * REGISTER / CREATE USER
 * =========================================
 */
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      affiliation,
      country,
      phone,
      address,
      role
    } = req.body;

    /**
     * =========================================
     * Trim & Normalize
     * =========================================
     */
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedAffiliation = affiliation?.trim();
    const trimmedCountry = country?.trim();
    const trimmedPhone = phone?.trim();
    const trimmedAddress = address?.trim();
    const userRole = role?.trim().toLowerCase();

    /**
     * =========================================
     * Required Field Validation
     * =========================================
     */
    if (
      !trimmedName ||
      !trimmedEmail ||
      !password ||
      !trimmedAffiliation ||
      !trimmedCountry ||
      !trimmedPhone ||
      !trimmedAddress ||
      !userRole
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    /**
     * =========================================
     * Name Validation
     * =========================================
     */
    if (trimmedName.length < 3 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 3 and 50 characters'
      });
    }

    /**
     * =========================================
     * Email Validation
     * =========================================
     */
    if (!validator.isEmail(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    /**
     * =========================================
     * Phone Validation
     * =========================================
     */
    if (!validator.isMobilePhone(trimmedPhone, 'any')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number'
      });
    }

    /**
     * =========================================
     * Password Validation
     * =========================================
     */
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    /**
     * =========================================
     * Role Validation
     * =========================================
     */
    const allowedRoles = ['admin', 'manager', 'user', 'staff'];

    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user role selected'
      });
    }

    /**
     * =========================================
     * Check Existing User
     * =========================================
     */
    const existingUser = await User.findOne({
      email: trimmedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    /**
     * =========================================
     * Hash Password
     * =========================================
     */
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    /**
     * =========================================
     * Create User
     * =========================================
     */
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      affiliation: trimmedAffiliation,
      country: trimmedCountry,
      phone: trimmedPhone,
      address: trimmedAddress,
      role: userRole
    });

    /**
     * =========================================
     * Response Data
     * =========================================
     */
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      affiliation: user.affiliation,
      country: user.country,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt
    };

    /**
     * =========================================
     * Success Response
     * =========================================
     */
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });

  } catch (err) {
    console.error('REGISTER USER ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};