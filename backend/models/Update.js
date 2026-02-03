const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Update", updateSchema);
