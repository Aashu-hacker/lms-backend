const mongoose = require("mongoose");

const ReportCommentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectVersion",
      required: true,
      index: true,
    },

    x: {
      type: Number,
      required: true,
    },

    y: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: null,
    },

    managerNote: {
      type: String,
      default: null,
    },
    
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ReportComment", ReportCommentSchema);
