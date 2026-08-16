const Customer = require("../models/Customer");
const User = require("../models/User");
const Notification = require("../models/Notification");
const logActivity = require("../utils/activityLogger");

// ======================
// Helper: Normalize role to match schema enum exactly ("Admin" | "Manager" | "Sales")
// This prevents ValidationErrors when req.user.role is stored/cased inconsistently
// (e.g. "sales", "SALES", "admin") anywhere upstream (JWT payload, DB, etc.)
// ======================
const normalizeRole = (role) => {
    if (!role) return "Sales";
    const lower = String(role).toLowerCase();
    if (lower === "admin") return "Admin";
    if (lower === "manager") return "Manager";
    return "Sales";
};

// Helper: turn any Windows/relative multer path into a clean, web-safe path
// e.g. "uploads\\file-123.pdf" -> "uploads/file-123.pdf"
const toWebPath = (filename) => `uploads/${filename}`.replace(/\\/g, "/");

// ======================
// Create Customer
// ======================
const createCustomer = async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        await logActivity(
            customer._id,
            req.user._id || req.user.id,
            "CUSTOMER_CREATED",
            "Customer created"
        );

        res.status(201).json({ success: true, customer });
    } catch (error) {
        console.error("Create customer error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// ======================
// Get All Customers (Role-Based Access Scoping + Search + Filter + Pagination)
// ======================
const getCustomers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};
        const userRole = req.user?.role?.toLowerCase();
        const userId = req.user?._id || req.user?.id;

        if (userRole === "sales") {
            query = { assignedTo: userId };
        } else if (userRole === "manager") {
            const teamReps = await User.find({ manager: userId }).select("_id");
            const teamRepIds = teamReps.map((rep) => rep._id);

            query = {
                $or: [
                    { assignedManager: userId },
                    { assignedTo: { $in: teamRepIds } },
                ],
            };
        }
        // Admin sees everything

        if (req.query.search) {
            const searchRegex = { $regex: req.query.search, $options: "i" };
            const searchConditions = [
                { name: searchRegex },
                { email: searchRegex },
                { company: searchRegex },
                { phone: searchRegex },
            ];

            if (query.$or) {
                query = { $and: [{ $or: query.$or }, { $or: searchConditions }] };
            } else {
                query.$or = searchConditions;
            }
        }

        if (req.query.status && req.query.status !== "All") {
            query.status = req.query.status;
        }

        if (req.query.assignedTo) {
            query.assignedTo = req.query.assignedTo;
        }

        const customers = await Customer.find(query)
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCustomers = await Customer.countDocuments(query);

        res.status(200).json({
            success: true,
            page,
            totalPages: Math.ceil(totalCustomers / limit),
            totalCustomers,
            count: customers.length,
            customers,
        });
    } catch (error) {
        console.error("Get customers error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ======================
// Get Single Customer (Strict Private Scratchpad Notes)
// ======================
const getCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email")
            .populate("notes.createdBy", "name email");

        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const currentUserId = (req.user?._id || req.user?.id || "").toString();
        const userRole = (req.user?.role || "").toLowerCase();

        const customerObj = customer.toObject();

        // Admins can see all notes; everyone else only sees their own private notes
        // (or notes explicitly marked non-private)
        if (userRole !== "admin") {
            customerObj.notes = (customerObj.notes || []).filter((n) => {
                if (n.isPrivate === false) return true;
                const noteCreatorId = n.createdBy?._id
                    ? n.createdBy._id.toString()
                    : (n.createdBy ? n.createdBy.toString() : "");
                return noteCreatorId === currentUserId;
            });
        }

        res.status(200).json({ success: true, customer: customerObj });
    } catch (error) {
        console.error("Get single customer error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ======================
// Update Customer (Status & Detail Updates for Admin, Manager & Sales)
//
// IMPORTANT: We load the document and assign fields individually, then .save(),
// instead of Customer.findByIdAndUpdate(...). Mongoose's `required` validators only
// run against paths that are actually being modified, so a partial update (e.g. only
// `status`) will NOT fail because of other required fields on the schema — as long as
// we don't accidentally overwrite those fields with `undefined`/empty string.
// ======================
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const previousStatus = customer.status;
        const { name, email, phone, company, status, assignedTo } = req.body;

        if (name !== undefined && name !== "") customer.name = name.trim();
        if (email !== undefined && email !== "") customer.email = email.trim();
        if (phone !== undefined) customer.phone = phone.trim();
        if (company !== undefined) customer.company = company.trim();
        if (status !== undefined && status !== "") customer.status = status;

        // Never assign an empty string to an ObjectId ref field — that throws a CastError
        if (assignedTo !== undefined && assignedTo !== "") {
            customer.assignedTo = assignedTo;
        }

        await customer.save();

        if (status && status !== previousStatus) {
            await logActivity(
                customer._id,
                req.user._id || req.user.id,
                "CUSTOMER_STATUS_UPDATED",
                `Status updated from '${previousStatus}' to '${status}'`
            );
        } else {
            await logActivity(
                customer._id,
                req.user._id || req.user.id,
                "CUSTOMER_UPDATED",
                `Customer details updated`
            );
        }

        const updatedCustomer = await Customer.findById(customer._id)
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email")
            .populate("notes.createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            customer: updatedCustomer,
        });
    } catch (error) {
        console.error("Update customer error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// ======================
// Update Customer Status Directly (dedicated status-only endpoint)
// ======================
const updateCustomerStatus = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const previousStatus = customer.status;
        if (req.body.status) {
            customer.status = req.body.status;
        }
        await customer.save();

        await logActivity(
            customer._id,
            req.user._id || req.user.id,
            "CUSTOMER_STATUS_UPDATED",
            `Status changed from '${previousStatus}' to '${customer.status}'`
        );

        const updatedCustomer = await Customer.findById(customer._id)
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email");

        res.status(200).json({
            success: true,
            message: "Status updated successfully",
            customer: updatedCustomer,
        });
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// ======================
// Delete Customer
// ======================
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        await customer.deleteOne();
        await logActivity(
            customer._id,
            req.user._id || req.user.id,
            "CUSTOMER_DELETED",
            "Customer deleted"
        );

        res.status(200).json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        console.error("Delete customer error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ======================
// Assign Customer Directly (Instant Assignment)
// ======================
const assignCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const salesUser = await User.findById(req.body.assignedTo);
        if (!salesUser) {
            return res.status(404).json({ success: false, message: "Sales user not found" });
        }

        if (normalizeRole(salesUser.role) !== "Sales") {
            return res.status(400).json({ success: false, message: "Selected user must have role 'Sales'" });
        }

        customer.assignedTo = salesUser._id;
        customer.assignedManager = salesUser.manager || undefined;
        customer.managerApprovalStatus = "Accepted";
        customer.salesApprovalStatus = "Accepted";
        customer.assignmentStatus = "Accepted";

        await customer.save();

        const populatedCustomer = await Customer.findById(customer._id)
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email");

        await logActivity(
            customer._id,
            req.user._id || req.user.id,
            "CUSTOMER_ASSIGNED",
            `Customer directly assigned to ${salesUser.name || salesUser._id}`
        );

        try {
            await Notification.create({
                recipient: salesUser._id,
                sender: req.user._id || req.user.id,
                customer: customer._id,
                type: "CUSTOMER_ASSIGNMENT_SALES",
                message: `Customer '${customer.name}' has been assigned to you.`,
            });
        } catch (notificationError) {
            console.error("Failed to create sales assignment notification:", notificationError);
        }

        if (salesUser.manager) {
            try {
                await Notification.create({
                    recipient: salesUser.manager,
                    sender: req.user._id || req.user.id,
                    customer: customer._id,
                    type: "CUSTOMER_ASSIGNMENT_MANAGER",
                    message: `Customer '${customer.name}' has been assigned to team member '${salesUser.name}'.`,
                });
            } catch (notificationError) {
                console.error("Failed to create manager assignment notification:", notificationError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Customer assigned successfully.",
            customer: populatedCustomer,
        });
    } catch (error) {
        console.error("Assign customer error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ======================
// Legacy Approval Stubs (API Compatibility)
// ======================
const managerAcceptAssignment = async (req, res) => {
    res.status(200).json({ success: true, message: "Assignment already accepted." });
};
const managerRejectAssignment = async (req, res) => {
    res.status(200).json({ success: true, message: "Assignment rejected." });
};
const salesAcceptAssignment = async (req, res) => {
    res.status(200).json({ success: true, message: "Assignment already accepted." });
};
const salesRejectAssignment = async (req, res) => {
    res.status(200).json({ success: true, message: "Assignment rejected." });
};
const getPendingManagerAssignments = async (req, res) => {
    res.status(200).json({ success: true, count: 0, customers: [] });
};
const getPendingSalesAssignments = async (req, res) => {
    res.status(200).json({ success: true, count: 0, customers: [] });
};

// ======================
// Get My Customers
// ======================
const getMyCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({ assignedTo: req.user._id || req.user.id })
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: customers.length, customers });
    } catch (error) {
        console.error("Get my customers error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// ======================
// Add Customer Note (Private Scratchpad Note)
// ======================
const addCustomerNote = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const noteText = req.body.note?.trim();
        if (!noteText) {
            return res.status(400).json({ success: false, message: "Note cannot be empty" });
        }

        const userId = req.user._id || req.user.id;
        const userRole = normalizeRole(req.user.role);

        customer.notes.push({
            text: noteText,
            createdBy: userId,
            creatorRole: userRole,
            isPrivate: true,
            createdAt: new Date(),
        });

        await customer.save();
        await logActivity(customer._id, userId, "NOTE_ADDED", noteText);

        const updatedCustomer = await Customer.findById(customer._id)
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email")
            .populate("notes.createdBy", "name email");

        const currentUserId = userId.toString();
        const customerObj = updatedCustomer.toObject();
        customerObj.notes = (customerObj.notes || []).filter((n) => {
            if (n.isPrivate === false) return true;
            const noteCreatorId = n.createdBy?._id
                ? n.createdBy._id.toString()
                : (n.createdBy ? n.createdBy.toString() : "");
            return noteCreatorId === currentUserId;
        });

        res.status(200).json({
            success: true,
            message: "Private note saved successfully",
            customer: customerObj,
            notes: customerObj.notes,
        });
    } catch (error) {
        console.error("Add note error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// ======================
// Send Team Message (@mention Direct Routing)
// ======================
const sendTeamMessage = async (req, res) => {
    try {
        const { message, customerId } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Message cannot be empty." });
        }

        const trimmedMsg = message.trim();
        const senderId = (req.user._id || req.user.id).toString();
        const senderName = req.user.name || "Team Member";
        const senderRole = normalizeRole(req.user.role);

        const recipientsToNotify = new Set();
        const allUsers = await User.find({}).select("_id name role email");

        const msgLower = trimmedMsg.toLowerCase();
        const hasAdminTag = /@admin\b/i.test(trimmedMsg);
        const hasManagerTag = /@manager\b/i.test(trimmedMsg);
        const hasSalesTag = /@sales\b/i.test(trimmedMsg);

        allUsers.forEach((u) => {
            const uId = u._id.toString();
            if (uId === senderId) return;

            const role = (u.role || "").toLowerCase();
            const name = (u.name || "").toLowerCase().trim();
            const firstName = name.split(/\s+/)[0] || "";

            const roleMatch =
                (role === "admin" && hasAdminTag) ||
                (role === "manager" && hasManagerTag) ||
                (role === "sales" && hasSalesTag);

            const nameMatch = name && msgLower.includes(`@${name}`);
            const firstNameMatch = firstName && msgLower.includes(`@${firstName}`);

            const combinedMatch =
                (name && msgLower.includes(`@${role} ${name}`)) ||
                (firstName && msgLower.includes(`@${role} ${firstName}`));

            if (roleMatch || nameMatch || firstNameMatch || combinedMatch) {
                recipientsToNotify.add(u._id);
            }
        });

        if (recipientsToNotify.size === 0) {
            return res.status(400).json({
                success: false,
                message: "No matching team members found. Tag using @Admin, @Manager, or @Sales followed by the member's name.",
            });
        }

        const notificationPromises = Array.from(recipientsToNotify).map((recipientId) =>
            Notification.create({
                recipient: recipientId,
                sender: req.user._id || req.user.id,
                customer: customerId || undefined,
                type: "TEAM_MESSAGE_MENTION",
                message: `💬 Message from ${senderRole} ${senderName}: "${trimmedMsg}"`,
                isRead: false,
            })
        );

        await Promise.all(notificationPromises);

        res.status(200).json({
            success: true,
            message: `Message sent! ${recipientsToNotify.size} team member(s) notified.`,
            notifiedCount: recipientsToNotify.size,
        });
    } catch (error) {
        console.error("Send team message error:", error);
        res.status(500).json({ success: false, message: "Server Error sending team message." });
    }
};

// ======================
// Upload Customer File
//
// - filePath is always normalized to forward slashes ("uploads/xyz.png") so it works
//   identically on Windows/Mac/Linux and matches how the frontend resolves it.
// - uploadedByRole is normalized so it always matches the schema enum exactly, even if
//   req.user.role is cased inconsistently upstream.
// ======================
const uploadCustomerFile = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file was uploaded." });
        }

        if (!customer.attachments) {
            customer.attachments = [];
        }

        const userId = req.user._id || req.user.id;
        const userRole = normalizeRole(req.user.role);

        const newAttachment = {
            fileName: req.file.originalname,
            filePath: toWebPath(req.file.filename),
            uploadedBy: userId,
            uploadedByRole: userRole,
            uploadedAt: new Date(),
        };

        customer.attachments.push(newAttachment);
        await customer.save();

        await logActivity(customer._id, userId, "FILE_UPLOADED", req.file.originalname);

        const updatedCustomer = await Customer.findById(customer._id)
            .populate("assignedTo", "name email")
            .populate("assignedManager", "name email")
            .populate("notes.createdBy", "name email");

        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            attachments: updatedCustomer.attachments,
            customer: updatedCustomer,
        });
    } catch (error) {
        console.error("Upload file error:", error);
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    assignCustomer,
    managerAcceptAssignment,
    managerRejectAssignment,
    salesAcceptAssignment,
    salesRejectAssignment,
    getPendingManagerAssignments,
    getPendingSalesAssignments,
    updateCustomerStatus,
    getMyCustomers,
    addCustomerNote,
    sendTeamMessage,
    uploadCustomerFile,
};