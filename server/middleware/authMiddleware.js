const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "No token provided",
        });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the actual user from database using any possible token payload key
        const userId = decoded.id || decoded._id || decoded.userId;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found or token expired",
            });
        }

        // Attach user and normalized identifiers
        req.user = user;
        req.user.id = user._id.toString();

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid Token",
        });
    }
};

module.exports = protect;