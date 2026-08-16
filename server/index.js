require("dotenv").config();   // Loads .env first



console.log("Mongo URI:", process.env.MONGODB_URI);

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const followUpRoutes = require("./routes/followUpRoutes");
const activityRoutes = require("./routes/activityRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// ==============================
// Middleware
// ==============================

app.use(cors({
    origin: "http://localhost:5173",
}));

app.use(express.json());

// ==============================
// Connect Database
// ==============================

connectDB();

// ==============================
// Routes
// ==============================

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

// ==============================
// Test Routes
// ==============================

app.get("/", (req, res) => {
    res.send("CRM Backend is Running 🚀");
});

app.get("/test", (req, res) => {
    res.send("Test Route Working");
});

// ==============================
// Start Server
// ==============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});