const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    phone: {
        type: String,
    },

    company: {
        type: String,
    },

    status: {
        type: String,
        enum: [
            "Lead",
            "Contacted",
            "Qualified",
            "Proposal Sent",
            "Won",
            "Lost",
        ],
        default: "Lead",
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    notes: {
        type: [
            {
                text: {
                    type: String,
                    required: true,
                },

                createdBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        default: [],
    },

    // ✅ Add this HERE
    attachments: {
        type: [
            {
                fileName: String,
                filePath: String,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        default: [],
    },

},
{
    timestamps: true,
});

module.exports = mongoose.model("Customer", customerSchema);