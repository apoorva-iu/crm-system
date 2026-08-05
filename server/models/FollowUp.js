const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
{
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    type: {
        type: String,
        enum: ["Call", "Meeting", "Email", "Demo", "Other"],
        required: true,
    },

    note: {
        type: String,
        required: true,
    },

    followUpDate: {
        type: Date,
        required: true,
    },

    status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending",
    }

},
{
    timestamps: true,
});

module.exports = mongoose.model("FollowUp", followUpSchema);