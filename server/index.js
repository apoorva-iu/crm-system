require("dotenv").config();   // ✅ Loads .env first
console.log("Mongo URI:", process.env.MONGODB_URI);

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const followUpRoutes = require("./routes/followUpRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

// Middleware
app.use(express.json());

// Connect Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/activities", activityRoutes);


app.get("/", (req, res) => {
    res.send("CRM Backend is Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

app.get("/test", (req, res) => {
    res.send("Test Route Working");
});