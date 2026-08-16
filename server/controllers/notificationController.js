const Notification = require("../models/Notification");

// Helper: Safely extract logged-in user ID
const getUserId = (req) => {
    return req.user?._id || req.user?.id;
};

// ======================
// Get My Notifications
// @route   GET /api/notifications
// ======================
const getMyNotifications = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User ID missing from authorization token",
            });
        }

        const notifications = await Notification.find({
            recipient: userId,
        })
            .populate("sender", "name email role")
            .populate("customer", "name email company status")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            notifications,
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Get Unread Notification Count
// @route   GET /api/notifications/unread-count
// ======================
const getUnreadNotificationCount = async (req, res) => {
    try {
        const userId = getUserId(req);

        const count = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            count,
        });
    } catch (error) {
        console.error("Get unread count error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Mark One Notification As Read
// @route   PUT /api/notifications/:id/read
// ======================
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = getUserId(req);
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        if (notification.recipient.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this notification",
            });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            notification,
        });
    } catch (error) {
        console.error("Mark notification read error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Mark All Notifications As Read
// @route   PUT /api/notifications/read-all
// ======================
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = getUserId(req);

        await Notification.updateMany(
            {
                recipient: userId,
                isRead: false,
            },
            {
                $set: { isRead: true },
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        console.error("Mark all read error:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

module.exports = {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};