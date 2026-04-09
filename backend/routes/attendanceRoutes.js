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
        breaks: "-",
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
      breaks: "-",
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
    const dateStart = getISTDateStart(now);

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
    const dateStart = getISTDateStart(now);

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
    const dateStart = getISTDateStart(now);

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


router.get("/my-summary", auth, async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      user: req.user.id,
      date: { $gte: start, $lte: end },
    })
      .lean();

    let daysPresent = records.length;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekRecords = await Attendance.find({
      user: req.user.id,
      date: { $gte: weekStart, $lte: weekEnd },
    }).lean();

    let daysPresentThisWeek = weekRecords.length;

    res.json({
      month,
      year,
      daysPresent,
      daysPresentThisWeek,
    });
  } catch (error) {
    console.error("My summary error:", error);
    res.status(500).json({ msg: "Failed to fetch attendance summary" });
  }
});

router.get("/in-office", auth, async (req, res) => {
  try {
    const now = new Date();
    const dateStart = getISTDateStart(now);

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
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("In office error:", error);
    res.status(500).json({ msg: "Failed to fetch employees in office" });
  }
});

// All employees attendance for a month (read-only, for attendance sheet page)
router.get("/team-monthly", auth, async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(year, month, 0).getDate();

    const [allUsers, records] = await Promise.all([
      User.find({}).select("_id name email").lean(),
      Attendance.find({ date: { $gte: start, $lte: end } })
        .populate("user", "name email")
        .lean(),
    ]);

    // Build a map: userId -> { dayNumber -> record }
    const userMap = {};
    allUsers.forEach((u) => {
      userMap[u._id.toString()] = {
        user: { _id: u._id, name: u.name || u.email, email: u.email },
        days: {},
        totalPresent: 0,
        totalHours: 0,
      };
    });

    records.forEach((r) => {
      const uid = r.user?._id?.toString() || r.user?.toString();
      if (!uid || !userMap[uid]) return;
      const day = new Date(r.date).getDate();
      const status = getAttendanceStatus(r.checkIn, r.checkOut);
      userMap[uid].days[day] = {
        present: true,
        checkIn: formatTime(r.checkIn),
        checkOut: r.checkOut ? formatTime(r.checkOut) : "",
        workHours: Math.round((status.totalWorkMinutes / 60) * 10) / 10,
      };
      userMap[uid].totalPresent++;
      userMap[uid].totalHours += status.totalWorkMinutes / 60;
    });

    const result = Object.values(userMap).map((entry) => ({
      ...entry,
      totalHours: Math.round(entry.totalHours * 10) / 10,
    }));

    res.json({
      month,
      year,
      daysInMonth,
      workingDays: getWorkingDaysInMonth(month, year),
      employees: result,
    });
  } catch (error) {
    console.error("Team monthly error:", error);
    res.status(500).json({ msg: "Failed to fetch team attendance" });
  }
});

// Analytics: weekly attendance & work hours for the logged-in user (last 12 weeks)
router.get("/analytics", auth, async (req, res) => {
  try {
    const now = new Date();
    const userId = req.user.id;

    // --- Last 7 days daily data ---
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRecords = await Attendance.find({
      user: userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 }).lean();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().slice(0, 10);
      const record = dailyRecords.find(
        (r) => new Date(r.date).toISOString().slice(0, 10) === dateStr
      );
      const workHours = record
        ? getAttendanceStatus(record.checkIn, record.checkOut).totalWorkMinutes / 60
        : 0;
      dailyData.push({
        day: dayNames[d.getDay()],
        date: dateStr,
        present: record ? 1 : 0,
        workHours: Math.round(workHours * 10) / 10,
      });
    }

    // --- Monthly attendance for current year (last 6 months) ---
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = await Attendance.countDocuments({
        user: userId,
        date: { $gte: m, $lte: mEnd },
      });
      const workingDays = getWorkingDaysInMonth(m.getMonth() + 1, m.getFullYear());
      monthlyData.push({
        month: monthNames[m.getMonth()],
        present: count,
        workingDays,
        absent: Math.max(0, workingDays - count),
      });
    }

    // --- Average work hours per day of week (last 30 days) ---
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentRecords = await Attendance.find({
      user: userId,
      date: { $gte: thirtyDaysAgo },
    }).lean();

    const dayHours = {};
    const dayCounts = {};
    dayNames.forEach((d) => { dayHours[d] = 0; dayCounts[d] = 0; });

    recentRecords.forEach((r) => {
      const dayName = dayNames[new Date(r.date).getDay()];
      const hours = getAttendanceStatus(r.checkIn, r.checkOut).totalWorkMinutes / 60;
      if (hours > 0) {
        dayHours[dayName] += hours;
        dayCounts[dayName] += 1;
      }
    });

    const avgHoursByDay = dayNames.map((d) => ({
      day: d,
      avgHours: dayCounts[d] > 0 ? Math.round((dayHours[d] / dayCounts[d]) * 10) / 10 : 0,
    }));

    res.json({ dailyData, monthlyData, avgHoursByDay });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ msg: "Failed to fetch analytics" });
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

function getISTDateStart(now) {
  // Convert any date to IST "start of day" (midnight IST)
  const istStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
  return new Date(istStr + "T00:00:00+05:30");
}

function formatTime(date) {
  const time = new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  return time + " IST";
}

function formatDisplayDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
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
    totalWorkMinutes: attendanceStatus.totalWorkMinutes,
  };
}

module.exports = router;
