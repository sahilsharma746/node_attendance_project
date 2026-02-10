const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const authModule = require("../middleware/auth");
const adminAuth = authModule.adminAuth || authModule;
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const User = require("../models/User");
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
        dateStr: new Date(r.date).toISOString().slice(0, 10),
        checkIn: formatTime(r.checkIn),
        checkOut: r.checkOut ? formatTime(r.checkOut) : "",
        checkInRaw: r.checkIn,
        checkOutRaw: r.checkOut,
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

router.patch("/records/:id", adminAuth, async (req, res) => {
  try {
    const { checkIn, checkOut } = req.body;
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ msg: "Attendance record not found" });
    }
    if (checkIn !== undefined) {
      const d = new Date(checkIn);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ msg: "Invalid check-in date" });
      }
      record.checkIn = d;
    }
    if (checkOut !== undefined) {
      if (checkOut === null || checkOut === "") {
        record.checkOut = null;
      } else {
        const d = new Date(checkOut);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ msg: "Invalid check-out date" });
        }
        record.checkOut = d;
      }
    }
    record.status = record.checkOut ? "Out" : "Present";
    await record.save();
    const populated = await Attendance.findById(record._id)
      .populate("user", "name email")
      .lean();
    const attendanceStatus = getAttendanceStatus(populated.checkIn, populated.checkOut);
    res.json({
      _id: populated._id,
      user: populated.user ? { name: populated.user.name, email: populated.user.email } : null,
      date: formatDisplayDate(populated.date),
      checkIn: formatTime(populated.checkIn),
      checkOut: populated.checkOut ? formatTime(populated.checkOut) : "",
      status: attendanceStatus.statusMessage,
      lateBy: attendanceStatus.lateByFormatted ?? "-",
      breaks: "-",
      isLate: attendanceStatus.isLate,
      lateMinutes: attendanceStatus.lateMinutes,
      totalWorkMinutes: attendanceStatus.totalWorkMinutes,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "Invalid record id" });
    }
    console.error("Update attendance error:", error);
    res.status(500).json({ msg: "Failed to update attendance record" });
  }
});

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

router.get("/in-office", auth, async (req, res) => {
  try {
    const now = new Date();
    const dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const records = await Attendance.find({
      date: dateStart,
      checkOut: null, // Only those who haven't checked out
    })
      .populate("user", "name email")
      .sort({ checkIn: 1 })
      .lean();

    const formatted = records.map((r) => {
      const attendanceStatus = getAttendanceStatus(r.checkIn, r.checkOut);
      return {
        _id: r._id,
        user: r.user ? { 
          _id: r.user._id,
          name: r.user.name, 
          email: r.user.email 
        } : null,
        checkIn: formatTime(r.checkIn),
        checkInRaw: r.checkIn,
        status: attendanceStatus.statusMessage,
        isLate: attendanceStatus.isLate,
        lateMinutes: attendanceStatus.lateMinutes,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("In office error:", error);
    res.status(500).json({ msg: "Failed to fetch employees in office" });
  }
});

// Admin: today's late arrivals (IST)
router.get("/late-today", adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const records = await Attendance.find({
      date: { $gte: dateStart, $lte: dateEnd },
    })
      .populate("user", "name email")
      .sort({ checkIn: 1 })
      .lean();

    const formatted = records
      .map((r) => {
        const attendanceStatus = getAttendanceStatus(r.checkIn, r.checkOut);
        return {
          _id: r._id,
          user: r.user ? { _id: r.user._id, name: r.user.name, email: r.user.email } : null,
          checkIn: formatTime(r.checkIn),
          lateBy: attendanceStatus.lateByFormatted ?? null,
          isLate: attendanceStatus.isLate,
        };
      })
      .filter((r) => r.isLate);

    res.json(formatted);
  } catch (error) {
    console.error("Late today error:", error);
    res.status(500).json({ msg: "Failed to fetch late arrivals" });
  }
});

// Admin: attendance summary for a month (days present, days on leave, total working days)
router.get("/summary", adminAuth, async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const totalWorkingDays = getWorkingDaysInMonth(month, year);

    const [allUsers, attendanceInMonth, approvedLeaves] = await Promise.all([
      User.find({}).select("_id name email").lean(),
      Attendance.find({ date: { $gte: start, $lte: end } }).lean(),
      Leave.find({
        status: "approved",
        startDate: { $lte: end },
        endDate: { $gte: start },
      }).lean(),
    ]);

    const daysPresentByUser = {};
    attendanceInMonth.forEach((a) => {
      const uid = a.user.toString();
      daysPresentByUser[uid] = (daysPresentByUser[uid] || 0) + 1;
    });

    const daysOnLeaveByUser = {};
    approvedLeaves.forEach((l) => {
      const overlapStart = l.startDate <= start ? start : l.startDate;
      const overlapEnd = l.endDate >= end ? end : l.endDate;
      const days = Math.max(0, Math.ceil((overlapEnd - overlapStart) / (24 * 60 * 60 * 1000)) + 1);
      const uid = l.user.toString();
      daysOnLeaveByUser[uid] = (daysOnLeaveByUser[uid] || 0) + days;
    });

    const summary = allUsers.map((u) => ({
      user: { _id: u._id, name: u.name || u.email, email: u.email },
      daysPresent: daysPresentByUser[u._id.toString()] || 0,
      daysOnLeave: daysOnLeaveByUser[u._id.toString()] || 0,
      totalWorkingDays,
    }));

    res.json(summary);
  } catch (error) {
    console.error("Attendance summary error:", error);
    res.status(500).json({ msg: "Failed to fetch attendance summary" });
  }
});

function getWorkingDaysInMonth(month, year) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

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
