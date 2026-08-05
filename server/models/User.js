const mongoose = require("mongoose");

// Create User Schema (Blueprint)
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Admin", "Sales"],
      default: "Sales",
    },
  },
  {
    timestamps: true,
  }
);

// Create Model
const User = mongoose.model("User", userSchema);

// Export Model
module.exports = User;