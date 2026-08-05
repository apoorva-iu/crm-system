const FollowUp = require("../models/FollowUp");

// ==============================
// Create Follow-up
// ==============================
const createFollowUp = async (req, res) => {
    try {

        const followUp = await FollowUp.create({
            customer: req.body.customer,
            user: req.user.id,
            type: req.body.type,
            note: req.body.note,
            followUpDate: req.body.followUpDate,
        });

        res.status(201).json({
            success: true,
            followUp,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });

    }
};

// ==============================
// Get My Follow-ups
// ==============================
const getMyFollowUps = async (req, res) => {
    try {

        const followUps = await FollowUp.find({
            user: req.user.id,
        })
        .populate("customer", "name company")
        .sort({ followUpDate: 1 });

        res.status(200).json({
            success: true,
            count: followUps.length,
            followUps,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });

    }
};

// ==============================
// Update Follow-up Status
// ==============================
const updateFollowUpStatus = async (req, res) => {
    try {

        const followUp = await FollowUp.findById(req.params.id);

        if (!followUp) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found",
            });
        }

        followUp.status = req.body.status;

        await followUp.save();

        res.status(200).json({
            success: true,
            message: "Follow-up updated",
            followUp,
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });

    }
};

// ==============================
// Delete Follow-up
// ==============================
const deleteFollowUp = async (req, res) => {
    try {

        const followUp = await FollowUp.findById(req.params.id);

        if (!followUp) {
            return res.status(404).json({
                success: false,
                message: "Follow-up not found",
            });
        }

        await FollowUp.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Follow-up deleted successfully",
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
        });

    }
};

module.exports = {
    createFollowUp,
    getMyFollowUps,
    updateFollowUpStatus,
    deleteFollowUp,
};