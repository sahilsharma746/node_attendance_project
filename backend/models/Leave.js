const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["casual", "sick", "emergency", "other"],
      default: "casual",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    halfDaySession: {
      type: String,
      enum: ["first_half", "second_half", null],
      default: null,
    },
    document: {
      type: String,
      default: "",
    },
    documentName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

leaveSchema.pre("save", function () {
  if (this.endDate < this.startDate) {
    throw new Error("End date must be on or after start date");
  }
});

module.exports = mongoose.model("Leave", leaveSchema);
