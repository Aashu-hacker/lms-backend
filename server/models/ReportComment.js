const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["manager", "analyst", "client", "admin"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    replyType: {
      type: String,
      enum: ["internal", "client"],
      default: "internal",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

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

    notes: [NoteSchema],

    status: {
      type: String,
      enum: ["open", "reopen", "resolved"],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReportComment", ReportCommentSchema);