const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    },

    type: {
      type: String,
      enum: [
        "PROJECT_ASSIGNED",
        "PROJECT_UPDATED",
        "PROJECT_DELETED",
        "GENERAL"
      ],
      default: "GENERAL"
    },

    message: {
      type: String,
      required: true
    },

    isRead: {
      type: Boolean,
      default: false
    },

    isNew: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
