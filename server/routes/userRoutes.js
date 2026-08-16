const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getUsers,
    assignManager,
    removeManager,
} = require("../controllers/userController");

router.get("/", protect, getUsers);

router.put("/:id/manager", protect, assignManager);

router.delete("/:id/manager", protect, removeManager);

module.exports = router;