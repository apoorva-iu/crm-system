const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            default: null,
        },

        type: {
            type: String,
            required: true,
            enum: [
                "CUSTOMER_ASSIGNMENT_MANAGER",
                "CUSTOMER_ASSIGNMENT_SALES",
                "CUSTOMER_ASSIGNMENT_ACCEPTED",
                "CUSTOMER_ASSIGNMENT_REJECTED",
                "TEAM_MESSAGE_MENTION",
                "NEW_NOTE_INSTRUCTION",
                "NOTE_REPLY_FROM_SALES",
            ],
        },

        message: {
            type: String,
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Speeds up the common "fetch this user's unread notifications" query
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);