const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authModule = require("../middleware/auth");
const adminAuth = authModule.adminAuth || authModule;
const Attendance = require("../models/Attendance");
const { getAttendanceStatus } = require("../utils/attendanceCalculator");


async function adminRecordsHandler(req, res) {
  try {
    const { user: userId, month, year } = req.query;
    const filter = {};
    if (userId) filter.user = userId;
    if (month !== undefined && year !== undefined) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(filter)
      .populate("user", "name email")
      .sort({ date: -1 })
      .limit(500)
      .lean();
    const formatted = records.map((r) => {
      const attendanceStatus = getAttendanceStatus(r.checkIn, r.checkOut);
      return {
        _id: r._id,
        user: r.user ? { name: r.user.name, email: r.user.email } : null,
        date: formatDisplayDate(r.date),
        checkIn: formatTime(r.checkIn),
        checkOut: r.checkOut ? formatTime(r.checkOut) : "",
        status: attendanceStatus.statusMessage,
        lateBy: attendanceStatus.lateByFormatted ?? "-",
        breaks: "-",
        isLate: attendanceStatus.isLate,
        lateMinutes: attendanceStatus.lateMinutes,
        totalWorkMinutes: attendanceStatus.totalWorkMinutes,
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error("Admin attendance records error:", error);
    res.status(500).json({ msg: "Failed to fetch attendance records" });
  }
}

router.get("/admin/records", adminAuth, adminRecordsHandler);
router.get("/records", adminAuth, adminRecordsHandler);

router.get("/history", auth, async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(100)
      .lean();

    const formatted = records.map((r) => {
      const attendanceStatus = getAttendanceStatus(r.checkIn, r.checkOut);
      return {
        id: r._id,
        date: formatDisplayDate(r.date),
        checkIn: formatTime(r.checkIn),
        checkOut: r.checkOut ? formatTime(r.checkOut) : "",
        status: attendanceStatus.statusMessage,
        isLate: attendanceStatus.isLate,
        lateMinutes: attendanceStatus.lateMinutes,
        totalWorkMinutes: attendanceStatus.totalWorkMinutes,
      };
    });


    res.json(formatted);
  } catch (error) {
    console.error("Attendance history error:", error);
    res.status(500).json({ msg: "Failed to fetch attendance history" });
  }
});

router.post("/check-in", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await Attendance.findOne({
      user: userId,
      date: dateStart,
    });

    if (existing) {
      return res.status(400).json({
        msg: "Already checked in today",
        record: formatRecord(existing),
      });
    }

    const record = await Attendance.create({
      user: userId,
      date: dateStart,
      checkIn: now,
      status: "Present",
    });

    res.status(201).json({
      msg: "Checked in successfully",
      record: formatRecord(record),
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ msg: "Failed to check in" });
  }
});

router.post("/check-out", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const record = await Attendance.findOne({
      user: userId,
      date: dateStart,
    });

    if (!record) {
      return res.status(400).json({ msg: "No check-in found for today" });
    }

    if (record.checkOut) {
      return res.status(400).json({
        msg: "Already checked out today",
        record: formatRecord(record),
      });
    }

    record.checkOut = now;
    record.status = "Out";
    await record.save();

    res.json({
      msg: "Checked out successfully",
      record: formatRecord(record),
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ msg: "Failed to check out" });
  }
});

router.get("/today", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const record = await Attendance.findOne({
      user: userId,
      date: dateStart,
    }).lean();

    if (!record) {
      return res.json({ checkedIn: false, checkInTime: null, record: null });
    }

    res.json({
      checkedIn: !record.checkOut,
      checkInTime: record.checkIn,
      record: formatRecord(record),
    });
  } catch (error) {
    console.error("Today status error:", error);
    res.status(500).json({ msg: "Failed to get today's status" });
  }
});

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDisplayDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDisplayStatus(r) {
  return r.checkOut ? "Out" : "Present";
}

function formatRecord(r) {
  const d = r.date;
  const attendanceStatus = getAttendanceStatus(r.checkIn, r.checkOut);
  return {
    id: r._id,
    date: formatDisplayDate(d),
    checkIn: formatTime(r.checkIn),
    checkOut: r.checkOut ? formatTime(r.checkOut) : "",
    status: attendanceStatus.statusMessage,
    isLate: attendanceStatus.isLate,
    lateMinutes: attendanceStatus.lateMinutes,
    totalWorkMinutes: attendanceStatus.totalWorkMinutes,
  };
}

module.exports = router;
