const mongoose = require("mongoose");

const leadNoteSchema = new mongoose.Schema(
{
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    note: {
        type: String,
        required: true,
    }

},
{
    timestamps: true,
});

module.exports = mongoose.model("LeadNote", leadNoteSchema);