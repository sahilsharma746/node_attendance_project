const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/auth").adminAuth;
const Leave = require("../models/Leave");

const CASUAL_LEAVE_PER_YEAR = 24;

function formatLeave(leave, includeUser = false) {
  const doc = leave.toObject ? leave.toObject() : leave;
  const start = new Date(doc.startDate);
  const end = new Date(doc.endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const out = {
    _id: doc._id,
    type: doc.type,
    startDate: doc.startDate,
    endDate: doc.endDate,
    startDateStr: start.toISOString().slice(0, 10),
    endDateStr: end.toISOString().slice(0, 10),
    reason: doc.reason || "",
    status: doc.status,
    days,
    createdAt: doc.createdAt,
  };
  if (doc.adminNote) out.adminNote = doc.adminNote;
  if (includeUser && doc.user) {
    out.user = {
      _id: doc.user._id,
      name: doc.user.name,
      email: doc.user.email,
    };
  }
  return out;
}


router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(401).json({ msg: "User not found in token" });
    }
    const { type, startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: "Start date and end date are required" });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ msg: "Invalid date format" });
    }
    if (end < start) {
      return res.status(400).json({ msg: "End date must be on or after start date" });
    }
    const leave = await Leave.create({
      user: userId,
      type: type || "casual",
      startDate: start,
      endDate: end,
      reason: reason || "",
      status: "pending",
    });
    res.status(201).json(formatLeave(leave));
  } catch (error) {
    if (error.message && error.message.includes("End date")) {
      return res.status(400).json({ msg: error.message });
    }
    if (error.name === "ValidationError") {
      const firstMsg = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({ msg: firstMsg });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "Invalid user or date value" });
    }
    console.error("Create leave error:", error.name, error.message, error);
    res.status(500).json({ msg: "Failed to create leave request" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const formatted = leaves.map((l) => formatLeave(l));
    res.json(formatted);
  } catch (error) {
    console.error("My leaves error:", error);
    res.status(500).json({ msg: "Failed to fetch leave requests" });
  }
});

router.get("/my/stats", auth, async (req, res) => {
  try {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [approvedLeaves, pendingCount] = await Promise.all([
      Leave.find({
        user: req.user.id,
        status: "approved",
        startDate: { $gte: yearStart },
        endDate: { $lte: yearEnd },
      }).lean(),
      Leave.countDocuments({ user: req.user.id, status: "pending" }),
    ]);

    let usedDays = 0;
    for (const l of approvedLeaves) {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      usedDays += Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    const balance = Math.max(0, CASUAL_LEAVE_PER_YEAR - usedDays);
    res.json({
      totalBalance: CASUAL_LEAVE_PER_YEAR,
      usedThisYear: usedDays,
      remaining: balance,
      pendingCount,
    });
  } catch (error) {
    console.error("Leave stats error:", error);
    res.status(500).json({ msg: "Failed to fetch leave stats" });
  }
});

router.get("/admin", adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const leaves = await Leave.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    const formatted = leaves.map((l) => formatLeave(l, true));
    res.json(formatted);
  } catch (error) {
    console.error("Admin leaves error:", error);
    res.status(500).json({ msg: "Failed to fetch leave requests" });
  }
});

router.patch("/admin/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body;
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ msg: "Action must be 'approve' or 'reject'" });
    }
    const leave = await Leave.findById(id);
    if (!leave) return res.status(404).json({ msg: "Leave request not found" });
    if (leave.status !== "pending") {
      return res.status(400).json({ msg: "Leave request is already processed" });
    }
    leave.status = action === "approve" ? "approved" : "rejected";
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();
    if (adminNote) leave.adminNote = adminNote;
    await leave.save();
    const populated = await Leave.findById(leave._id).populate("user", "name email").lean();
    res.json(formatLeave(populated, true));
  } catch (error) {
    console.error("Review leave error:", error);
    res.status(500).json({ msg: "Failed to update leave request" });
  }
});

module.exports = router;
