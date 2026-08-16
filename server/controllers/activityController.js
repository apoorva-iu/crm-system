const Activity = require("../models/Activity");

// ======================
// Get Customer Activities
// @route   GET /api/activities/customer/:customerId
// ======================
const getCustomerActivities = async (req, res) => {
    try {
        const activities = await Activity.find({
            customer: req.params.customerId,
        })
            .populate("user", "name email role")
            .populate("customer", "name company email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (error) {
        console.error("Get customer activities error:", error);

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Get All System Activities (Admin / Audit Log)
// @route   GET /api/activities
// ======================
const getAllActivities = async (req, res) => {
    try {
        const activities = await Activity.find()
            .populate("user", "name email role")
            .populate("customer", "name company email")
            .sort({ createdAt: -1 })
            .limit(100); // Limit to latest 100 entries for performance

        return res.status(200).json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (error) {
        console.error("Get all activities error:", error);

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

module.exports = {
    getCustomerActivities,
    getAllActivities,
};