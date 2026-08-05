const express = require("express");
const router = express.Router();

const {
    getCustomerActivities,
} = require("../controllers/activityController");

const protect = require("../middleware/authMiddleware");

// Get all activities of a customer
router.get("/:customerId", protect, getCustomerActivities);

module.exports = router;