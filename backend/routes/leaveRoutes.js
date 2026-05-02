const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/auth").adminAuth;
const Leave = require("../models/Leave");
const User = require("../models/User");
const { sendEmail, leaveRequestEmail, leaveStatusEmail } = require("../utils/sendEmail");
const { getSheetLeaveCounts, getSheetLeaveForUser } = require("../utils/sheetLeaves");

const CASUAL_LEAVE_PER_MONTH = 1.5; // 1 full day + 1 half day per month
const CASUAL_LEAVE_PER_YEAR = CASUAL_LEAVE_PER_MONTH * 12; // 18 days per year

function calculateLeaveDays(doc) {
  if (doc.isShortBreak) return 0;
  if (doc.isHalfDay) return 0.5;
  const start = new Date(doc.startDate);
  const end = new Date(doc.endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function formatLeave(leave, includeUser = false) {
  const doc = leave.toObject ? leave.toObject() : leave;
  const start = new Date(doc.startDate);
  const end = new Date(doc.endDate);
  const days = calculateLeaveDays(doc);
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
    isHalfDay: !!doc.isHalfDay,
    halfDaySession: doc.halfDaySession || null,
    isShortBreak: !!doc.isShortBreak,
    breakHours: doc.breakHours || null,
    breakFromTime: doc.breakFromTime || "",
    breakToTime: doc.breakToTime || "",
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
    const { type, startDate, endDate, reason, isHalfDay, halfDaySession, isShortBreak, breakHours, breakFromTime, breakToTime, document: doc, documentName } = req.body;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({ msg: "Cannot request leave for past dates" });
    }
    if (isHalfDay) {
      if (start.toISOString().slice(0, 10) !== end.toISOString().slice(0, 10)) {
        return res.status(400).json({ msg: "Half-day leave must have the same start and end date" });
      }
      if (!["first_half", "second_half"].includes(halfDaySession)) {
        return res.status(400).json({ msg: "Half-day session must be 'first_half' or 'second_half'" });
      }
    }
    if (isShortBreak && (!breakHours || breakHours < 1 || breakHours > 3)) {
      return res.status(400).json({ msg: "Break duration must be 1, 2, or 3 hours" });
    }
    const leave = await Leave.create({
      user: userId,
      type: type || "casual",
      startDate: start,
      endDate: end,
      reason: reason || "",
      status: "pending",
      isHalfDay: !!isHalfDay && !isShortBreak,
      halfDaySession: isHalfDay && !isShortBreak ? halfDaySession : null,
      isShortBreak: !!isShortBreak,
      breakHours: isShortBreak ? breakHours : null,
      breakFromTime: isShortBreak ? (breakFromTime || "") : "",
      breakToTime: isShortBreak ? (breakToTime || "") : "",
      document: doc || "",
      documentName: documentName || "",
    });

    // Send email notification to admin(s)
    const employee = await User.findById(userId).select("name").lean();
    if (process.env.NOTIFY_EMAIL && employee) {
      const adminEmails = process.env.NOTIFY_EMAIL.split(",").map(e => e.trim());
      const emailData = leaveRequestEmail({
        employeeName: employee.name,
        type: type || "casual",
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        reason: reason || "",
        isHalfDay: !!isHalfDay,
        halfDaySession,
      });
      sendEmail({ to: adminEmails, ...emailData });
    }

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
    const currentMonth = now.getMonth() + 1; // 1-12
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const [approvedCasual, pendingCount, currentUser] = await Promise.all([
      Leave.find({
        user: req.user.id,
        status: "approved",
        type: "casual",
        startDate: { $gte: yearStart },
        endDate: { $lte: yearEnd },
      }).lean(),
      Leave.countDocuments({ user: req.user.id, status: "pending" }),
      User.findById(req.user.id).select("name").lean(),
    ]);

    // Total used casual leave days in current year (with half-day support)
    let usedCasualDays = 0;
    for (const l of approvedCasual) {
      usedCasualDays += calculateLeaveDays(l);
    }

    // Add leaves from Google Sheet (match by full name, fallback to first name)
    try {
      const sheetDays = await getSheetLeaveForUser(currentUser?.name || "");
      usedCasualDays += sheetDays;
    } catch (err) {
      console.error("Sheet leave fetch error:", err.message);
    }

    // Casual leave with expiry logic:
    // Each month grants CASUAL_LEAVE_PER_MONTH leaves.
    // Unused leaves expire after 6 months (e.g., Jan leaves expire at end of July).
    // Used leaves are deducted FIFO (oldest allocation first).
    const EXPIRY_MONTHS = 6;
    let remainingUsed = usedCasualDays;
    let available = 0;
    let expired = 0;

    for (let m = 1; m <= currentMonth; m++) {
      let allocation = CASUAL_LEAVE_PER_MONTH;

      // Deduct used leaves from oldest allocation first (FIFO)
      const deduct = Math.min(remainingUsed, allocation);
      remainingUsed -= deduct;
      allocation -= deduct;

      // Check if this month's remaining unused leaves have expired
      const isExpired = currentMonth > m + EXPIRY_MONTHS;
      if (isExpired) {
        expired += allocation; // unused portion is lost
      } else {
        available += allocation;
      }
    }

    // entitledSoFar = total non-expired leaves (before usage)
    let entitledSoFar = 0;
    for (let m = 1; m <= currentMonth; m++) {
      if (currentMonth <= m + EXPIRY_MONTHS) {
        entitledSoFar += CASUAL_LEAVE_PER_MONTH;
      }
    }

    res.json({
      totalBalance: CASUAL_LEAVE_PER_YEAR,
      perMonth: CASUAL_LEAVE_PER_MONTH,
      entitledSoFar,
      usedThisYear: usedCasualDays,
      remaining: available,
      expired,
      pendingCount,
      currentMonth,
    });
  } catch (error) {
    console.error("Leave stats error:", error);
    res.status(500).json({ msg: "Failed to fetch leave stats" });
  }
});

// Team calendar: all approved & pending leaves for a given month
router.get("/team-calendar", auth, async (req, res) => {
  try {
    const { year, month } = req.query; // month is 1-based
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const leaves = await Leave.find({
      status: { $in: ["approved", "pending"] },
      startDate: { $lte: endOfMonth },
      endDate: { $gte: startOfMonth },
    })
      .populate("user", "name email")
      .sort({ startDate: 1 })
      .lean();

    const formatted = leaves.map((l) => formatLeave(l, true));
    res.json(formatted);
  } catch (error) {
    console.error("Team calendar error:", error);
    res.status(500).json({ msg: "Failed to fetch team calendar data" });
  }
});

router.get("/on-leave-today", auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const leaves = await Leave.find({
      status: "approved",
      startDate: { $lte: endOfToday },
      endDate: { $gte: startOfToday },
    })
      .populate("user", "name email")
      .sort({ startDate: 1 })
      .lean();

    const formatted = leaves.map((l) => formatLeave(l, true));
    res.json(formatted);
  } catch (error) {
    console.error("On leave today error:", error);
    res.status(500).json({ msg: "Failed to fetch team on leave" });
  }
});

// Upcoming leaves: approved leaves starting from today onward
router.get("/upcoming", auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const leaves = await Leave.find({
      status: { $in: ["approved", "pending"] },
      endDate: { $gte: startOfToday },
    })
      .populate("user", "name email profilePic")
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    const formatted = leaves.map((l) => formatLeave(l, true));
    res.json(formatted);
  } catch (error) {
    console.error("Upcoming leaves error:", error);
    res.status(500).json({ msg: "Failed to fetch upcoming leaves" });
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

    // Send email notification to employee
    if (populated.user?.email) {
      const emailData = leaveStatusEmail({
        employeeName: populated.user.name,
        type: populated.type,
        startDate: new Date(populated.startDate).toISOString().slice(0, 10),
        endDate: new Date(populated.endDate).toISOString().slice(0, 10),
        status: leave.status,
        adminNote: adminNote || "",
        isHalfDay: !!populated.isHalfDay,
        halfDaySession: populated.halfDaySession,
      });
      sendEmail({ to: populated.user.email, ...emailData });
    }

    res.json(formatLeave(populated, true));
  } catch (error) {
    console.error("Review leave error:", error);
    res.status(500).json({ msg: "Failed to update leave request" });
  }
});

router.delete("/admin/:id", adminAuth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: "Leave request not found" });
    if (leave.status === "pending") {
      return res.status(400).json({ msg: "Cannot delete a pending request. Approve or reject it first." });
    }
    await Leave.findByIdAndDelete(req.params.id);
    res.json({ msg: "Leave request deleted" });
  } catch (error) {
    console.error("Delete leave error:", error);
    res.status(500).json({ msg: "Failed to delete leave request" });
  }
});

module.exports = router;
