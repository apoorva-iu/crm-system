const express = require("express");
const router = express.Router();

const {
    createCustomer,
    getCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    assignCustomer,
    updateCustomerStatus,
    getMyCustomers,
    addCustomerNote,
    uploadCustomerFile,
} = require("../controllers/customerController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Create Customer
router.post("/", protect, createCustomer);

// Get All Customers
router.get("/", protect, getCustomers);

// Get My Customers (must come BEFORE /:id)
router.get("/my/customers", protect, getMyCustomers);

// Get Single Customer
router.get("/:id", protect, getCustomer);

// Update Customer
router.put("/:id", protect, updateCustomer);

// Delete Customer
router.delete("/:id", protect, deleteCustomer);

// Assign Customer
router.put("/:id/assign", protect, assignCustomer);

// Update Status
router.put("/:id/status", protect, updateCustomerStatus);

// Add Note
router.post("/:id/notes", protect, addCustomerNote);
router.post(
    "/:id/upload",
    protect,
    upload.single("file"),
    uploadCustomerFile
);


module.exports = router;