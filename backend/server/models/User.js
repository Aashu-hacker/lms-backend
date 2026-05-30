// ==============================|| models/User.js ||============================== //

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, 'Password is required']
    },

    plainPassword:{
      type:String,
    },

    affiliation: {
      type: String,
      enum: ['University', 'Institute', 'Company', 'Hospital', 'Other'],
      default: 'Other'
    },

    address: {
      type: String,
      default: ''
    },

    country: {
      type: String,
      default: ''
    },

    phone: {
      type: String,
      default: ''
    },

    role: {
      type: String,
      enum: ['admin', 'manager', 'analyst', 'client'],
      default: 'client'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);