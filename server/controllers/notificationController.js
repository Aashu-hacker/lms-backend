/* ==============================|| STEP 5: GET USER NOTIFICATIONS ||============================== */
// controllers/notificationController.js

const Notification = require("../models/Notification");

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.params.userId
    })
      .populate("sender", "name email")
      .populate("project", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
};



/* ==============================|| STEP 6: MARK ALL AS READ ||============================== */

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.params.userId },
      {
        isRead: true,
        isNew: false
      }
    );

    res.status(200).json({
      message: "All notifications marked as read"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notifications",
      error: error.message
    });
  }
};
