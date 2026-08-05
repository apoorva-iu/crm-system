const Customer = require("../models/Customer");
const User = require("../models/User");
const FollowUp = require("../models/FollowUp");

const getDashboardStats = async (req, res) => {
    try {

        // ==========================
        // ADMIN DASHBOARD
        // ==========================
        if (req.user.role === "Admin") {

            const totalCustomers = await Customer.countDocuments();

            const totalSalespersons = await User.countDocuments({
                role: "Sales",
            });

            const totalLeads = await Customer.countDocuments({
                status: "Lead",
            });

            const contacted = await Customer.countDocuments({
                status: "Contacted",
            });

            const qualified = await Customer.countDocuments({
                status: "Qualified",
            });

            const proposalSent = await Customer.countDocuments({
                status: "Proposal Sent",
            });

            const wonDeals = await Customer.countDocuments({
                status: "Won",
            });

            const lostDeals = await Customer.countDocuments({
                status: "Lost",
            });

            const assignedCustomers = await Customer.countDocuments({
                assignedTo: { $ne: null },
            });

            const unassignedCustomers = await Customer.countDocuments({
                assignedTo: null,
            });

            const totalFollowUps = await FollowUp.countDocuments();

            const pendingFollowUps = await FollowUp.countDocuments({
                status: "Pending",
            });

            const completedFollowUps = await FollowUp.countDocuments({
                status: "Completed",
            });

            const overdueFollowUps = await FollowUp.countDocuments({
                status: "Pending",
                followUpDate: { $lt: new Date() },
            });

            return res.status(200).json({
                success: true,
                role: "Admin",
                dashboard: {
                    totalCustomers,
                    totalSalespersons,
                    totalLeads,
                    contacted,
                    qualified,
                    proposalSent,
                    wonDeals,
                    lostDeals,
                    assignedCustomers,
                    unassignedCustomers,
                    totalFollowUps,
                    pendingFollowUps,
                    completedFollowUps,
                    overdueFollowUps,
                },
            });
        }

        // ==========================
        // SALES DASHBOARD
        // ==========================

        const myCustomers = await Customer.countDocuments({
            assignedTo: req.user.id,
        });

        const myLeads = await Customer.countDocuments({
            assignedTo: req.user.id,
            status: "Lead",
        });

        const myContacted = await Customer.countDocuments({
            assignedTo: req.user.id,
            status: "Contacted",
        });

        const myQualified = await Customer.countDocuments({
            assignedTo: req.user.id,
            status: "Qualified",
        });

        const myProposalSent = await Customer.countDocuments({
            assignedTo: req.user.id,
            status: "Proposal Sent",
        });

        const myWonDeals = await Customer.countDocuments({
            assignedTo: req.user.id,
            status: "Won",
        });

        const myLostDeals = await Customer.countDocuments({
            assignedTo: req.user.id,
            status: "Lost",
        });

        const myPendingFollowUps = await FollowUp.countDocuments({
            user: req.user.id,
            status: "Pending",
        });

        const myCompletedFollowUps = await FollowUp.countDocuments({
            user: req.user.id,
            status: "Completed",
        });

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);

        tomorrow.setDate(today.getDate() + 1);

        const todayFollowUps = await FollowUp.countDocuments({
            user: req.user.id,
            followUpDate: {
                $gte: today,
                $lt: tomorrow,
            },
        });

        const overdueFollowUps = await FollowUp.countDocuments({
            user: req.user.id,
            status: "Pending",
            followUpDate: {
                $lt: today,
            },
        });

        res.status(200).json({
            success: true,
            role: "Sales",
            dashboard: {
                myCustomers,
                myLeads,
                myContacted,
                myQualified,
                myProposalSent,
                myWonDeals,
                myLostDeals,
                myPendingFollowUps,
                myCompletedFollowUps,
                todayFollowUps,
                overdueFollowUps,
            },
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
    getDashboardStats,
};