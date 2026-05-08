/* ==============================|| STEP 2: UPDATE createNotification.js ||============================== */
// utils/createNotification.js

const Notification = require("../models/Notification");

const createNotification = async ({
  users,
  sender,
  project,
  type,
  message
}) => {
  try {
    const notifications = await Notification.insertMany(
      users.map((userId) => ({
        user: userId,
        sender,
        project,
        type,
        message
      }))
    );

    // ==============================|| REAL-TIME EMIT ||============================== //
    users.forEach((userId, index) => {
      const socketId = global.onlineUsers.get(userId.toString());

      if (socketId) {
        global.io.to(socketId).emit(
          "newNotification",
          notifications[index]
        );
      }
    });

    return notifications;
  } catch (error) {
    console.error("Notification creation error:", error);
  }
};

module.exports = createNotification;