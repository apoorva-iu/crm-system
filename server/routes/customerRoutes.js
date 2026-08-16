const express = require("express");
const router = express.Router();

const {
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
    sendTeamMessage,
    addCustomerNote,
    uploadCustomerFile,
} = require("../controllers/customerController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Create Customer
router.post("/", protect, createCustomer);

// Get All Customers
router.get("/", protect, getCustomers);

// Specialized queries (MUST come BEFORE /:id to avoid route collision)
router.get("/my/customers", protect, getMyCustomers);
router.get("/pending/manager", protect, getPendingManagerAssignments);
router.get("/pending/sales", protect, getPendingSalesAssignments);

// Team Messaging Endpoint (@mention direct notifications)
router.post("/message", protect, sendTeamMessage);

// Get Single Customer
router.get("/:id", protect, getCustomer);

// Update Customer
router.put("/:id", protect, updateCustomer);

// Delete Customer
router.delete("/:id", protect, deleteCustomer);

// Assign Customer
router.put("/:id/assign", protect, assignCustomer);

// Assignment Approval Workflow
router.put("/:id/manager-accept", protect, managerAcceptAssignment);
router.put("/:id/manager-reject", protect, managerRejectAssignment);
router.put("/:id/sales-accept", protect, salesAcceptAssignment);
router.put("/:id/sales-reject", protect, salesRejectAssignment);

// Update Status
router.put("/:id/status", protect, updateCustomerStatus);

// Add Note & File Uploads
router.post("/:id/notes", protect, addCustomerNote);
router.post(
    "/:id/upload",
    protect,
    upload.single("file"),
    uploadCustomerFile
);

module.exports = router;