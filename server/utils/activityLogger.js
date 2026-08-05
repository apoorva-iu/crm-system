const Activity = require("../models/Activity");

const logActivity = async (customerId, userId, action, description) => {
    try {
        console.log("========== Activity Logger ==========");
        console.log(customerId);
        console.log(userId);
        console.log(action);
        console.log(description);

        const activity = await Activity.create({
            customer: customerId,
            user: userId,
            action,
            description,
        });

        console.log("Activity Saved:", activity);

    } catch (error) {
        console.error("Activity Logger Error:");
        console.error(error);
    }
};

module.exports = logActivity;