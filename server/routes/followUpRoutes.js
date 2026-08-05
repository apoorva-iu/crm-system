const express = require("express");
const router = express.Router();

const {
    createFollowUp,
    getMyFollowUps,
    updateFollowUpStatus,
    deleteFollowUp,
} = require("../controllers/followUpController");

const protect = require("../middleware/authMiddleware");

// Create Follow-up
router.post("/", protect, createFollowUp);

// Get My Follow-ups
router.get("/", protect, getMyFollowUps);

// Update Follow-up Status
router.put("/:id", protect, updateFollowUpStatus);

// Delete Follow-up
router.delete("/:id", protect, deleteFollowUp);

module.exports = router;