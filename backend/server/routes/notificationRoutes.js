/* ==============================|| STEP 7: ROUTES ||============================== */
// routes/notificationRoutes.js

const express = require("express");
const router = express.Router();

const {
  getUserNotifications,
  markAllAsRead
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/user/:userId",
  authMiddleware,
  getUserNotifications
);

router.put(
  "/mark-all-read/:userId",
  authMiddleware,
  markAllAsRead
);

module.exports = router;