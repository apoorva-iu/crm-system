const Activity = require("../models/Activity");

// ======================
// Get Customer Activities
// ======================
const getCustomerActivities = async (req, res) => {
    try {

        const activities = await Activity.find({
            customer: req.params.customerId,
        })
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            activities,
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

module.exports = {
    getCustomerActivities,
};