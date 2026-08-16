const mongoose = require("mongoose");

// NOTE: I don't have your original models/Customer.js, so this is reconstructed
// from every field referenced across your controllers and dashboards. Please diff
// this against your real file before replacing it — the enums below are the part
// that actually matters for the bugs you're hitting.

const noteSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        // Must match normalizeRole() output exactly
        creatorRole: { type: String, enum: ["Admin", "Manager", "Sales"], default: "Sales" },
        isPrivate: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const attachmentSchema = new mongoose.Schema(
    {
        fileName: { type: String, required: true },
        // Always a forward-slash, web-safe relative path, e.g. "uploads/1699999999-file.pdf"
        filePath: { type: String, required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        uploadedByRole: { type: String, enum: ["Admin", "Manager", "Sales"], default: "Sales" },
        uploadedAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const customerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        company: { type: String, trim: true },

        status: {
            type: String,
            enum: ["Lead", "Qualified", "Customer", "Lost"],
            default: "Lead",
        },

        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        managerApprovalStatus: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending",
        },
        salesApprovalStatus: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending",
        },
        assignmentStatus: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected"],
            default: "Pending",
        },

        notes: [noteSchema],
        attachments: [attachmentSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);