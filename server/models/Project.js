const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      unique: true
    },

    title: {
      type: String,
      required: true
    },

    shortDescription: {
      type: String
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    analysts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    clients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    ngsApplications: [
      {
        type: String
      }
    ],

    priority:{
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },

    progress: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ['Active', 'In Progress', 'Completed', 'On Hold'],
      default: 'Active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);