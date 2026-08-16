const mongoose = require("mongoose");
const User = require("../models/User");

// @desc    Get all users (Admin only)
// @route   GET /api/users
const getUsers = async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        const users = await User.find()
            .select("-password")
            .populate("manager", "name email role");

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// @desc    Assign a Manager to a Sales user (Admin only)
// @route   PUT /api/users/:id/manager
const assignManager = async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        const { id } = req.params;
        const { managerId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id",
            });
        }

        const salesUser = await User.findById(id);

        if (!salesUser) {
            return res.status(404).json({
                success: false,
                message: "Sales user not found",
            });
        }

        if (salesUser.role !== "Sales") {
            return res.status(400).json({
                success: false,
                message: "Target user must have role 'Sales'",
            });
        }

        if (!managerId) {
            return res.status(400).json({
                success: false,
                message: "managerId is required",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(managerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid managerId",
            });
        }

        const manager = await User.findById(managerId);

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: "Manager not found",
            });
        }

        if (manager.role !== "Manager") {
            return res.status(400).json({
                success: false,
                message: "Selected user must have role 'Manager'",
            });
        }

        salesUser.manager = manager._id;
        await salesUser.save();

        const updatedSalesUser = await User.findById(salesUser._id)
            .select("-password")
            .populate("manager", "name email role");

        return res.status(200).json({
            success: true,
            message: "Manager assigned successfully",
            user: updatedSalesUser,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// @desc    Remove a Manager from a Sales user (Admin only)
// @route   DELETE /api/users/:id/manager
const removeManager = async (req, res) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id",
            });
        }

        const salesUser = await User.findById(id);

        if (!salesUser) {
            return res.status(404).json({
                success: false,
                message: "Sales user not found",
            });
        }

        if (salesUser.role !== "Sales") {
            return res.status(400).json({
                success: false,
                message: "Target user must have role 'Sales'",
            });
        }

        salesUser.manager = null;
        await salesUser.save();

        const updatedSalesUser = await User.findById(salesUser._id)
            .select("-password")
            .populate("manager", "name email role");

        return res.status(200).json({
            success: true,
            message: "Manager removed successfully",
            user: updatedSalesUser,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    getUsers,
    assignManager,
    removeManager,
};