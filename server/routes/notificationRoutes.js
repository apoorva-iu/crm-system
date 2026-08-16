const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} = require("../controllers/notificationController");

// Get all notifications for logged-in user
router.get("/", protect, getMyNotifications);

// Get count of unread notifications (Placed before /:id)
router.get("/unread-count", protect, getUnreadNotificationCount);

// Mark all notifications as read (Placed before /:id)
router.put("/read-all", protect, markAllNotificationsAsRead);

// Mark a single notification as read
router.put("/:id/read", protect, markNotificationAsRead);

module.exports = router;