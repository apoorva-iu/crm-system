const Customer = require("../models/Customer");
const logActivity = require("../utils/activityLogger");

// ======================
// Create Customer
// ======================
const createCustomer = async (req, res) => {
    try {
        const customer = await Customer.create(req.body);
        await logActivity(
            customer._id,
            req.user.id,
            "CUSTOMER_CREATED",
            "Customer created"
        );

        res.status(201).json({
            success: true,
            customer,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Get All Customers
// Search + Filter + Pagination
// ======================
const getCustomers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        // Search
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
                { company: { $regex: req.query.search, $options: "i" } },
                { phone: { $regex: req.query.search, $options: "i" } },
            ];
        }

        // Filter by Status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by Assigned User
        if (req.query.assignedTo) {
            query.assignedTo = req.query.assignedTo;
        }

        const customers = await Customer.find(query)
            .populate("assignedTo", "name email")
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
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Get Single Customer
// ======================
const getCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate("assignedTo", "name email");

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            customer,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Update Customer
// ======================
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        ).populate("assignedTo", "name email");

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        await logActivity(
            customer._id,
            req.user.id,
            "CUSTOMER_UPDATED",
            "Customer updated"
        );

        res.status(200).json({
            success: true,
            customer,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Delete Customer
// ======================
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        await customer.deleteOne();
        await logActivity(
            customer._id,
            req.user.id,
            "CUSTOMER_DELETED",
            "Customer deleted"
        );

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Assign Customer
// ======================
const assignCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        customer.assignedTo = req.body.assignedTo;

        await customer.save();

        const populatedCustomer = await Customer.findById(customer._id).populate("assignedTo", "name email");

        await logActivity(
            customer._id,
            req.user.id,
            "CUSTOMER_ASSIGNED",
            `Customer assigned to ${req.body.assignedTo}`
        );

        res.status(200).json({
            success: true,
            message: "Customer assigned successfully",
            customer: populatedCustomer,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Update Customer Status
// ======================
const updateCustomerStatus = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        customer.status = req.body.status;
        await customer.save();

        const populatedCustomer = await Customer.findById(customer._id).populate("assignedTo", "name email");

        await logActivity(
            customer._id,
            req.user.id,
            "CUSTOMER_STATUS_UPDATED",
            `Status changed to ${req.body.status}`
        );

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            customer: populatedCustomer,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Get My Customers
// ======================
const getMyCustomers = async (req, res) => {
    try {
        const customers = await Customer.find({
            assignedTo: req.user.id,
        }).populate("assignedTo", "name email");

        res.status(200).json({
            success: true,
            count: customers.length,
            customers,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

// ======================
// Add Customer Note
// ======================
const addCustomerNote = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        if (!customer.notes) {
            customer.notes = [];
        }

        customer.notes.push({
            text: req.body.note,
            createdBy: req.user.id,
            createdAt: new Date(),
        });

        await customer.save();
        await logActivity(
            customer._id,
            req.user.id,
            "NOTE_ADDED",
            req.body.note
        );

        res.status(200).json({
            success: true,
            message: "Note added successfully",
            notes: customer.notes,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
// ======================
// Upload Customer File
// ======================
const uploadCustomerFile = async (req, res) => {
    try {

        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        if (!customer.attachments) {
            customer.attachments = [];
        }

        customer.attachments.push({
            fileName: req.file.originalname,
            filePath: req.file.path,
        });

        await customer.save();

        await logActivity(
            customer._id,
            req.user.id,
            "FILE_UPLOADED",
            req.file.originalname
        );

        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            attachments: customer.attachments,
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

};