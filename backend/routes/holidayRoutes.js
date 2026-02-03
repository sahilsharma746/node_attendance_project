const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/auth").adminAuth;
const Holiday = require("../models/Holiday");

function formatHoliday(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  const date = new Date(d.date);
  return {
    _id: d._id,
    name: d.name,
    date: date.toISOString().slice(0, 10),
    dateDisplay: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    description: d.description || "",
    createdAt: d.createdAt,
  };
}

// List all holidays (admin or auth user)
router.get("/", auth, async (req, res) => {
  try {
    const { year } = req.query;
    const filter = {};
    if (year) {
      const y = Number(year);
      if (!Number.isNaN(y)) {
        filter.date = {
          $gte: new Date(y, 0, 1),
          $lte: new Date(y, 11, 31, 23, 59, 59, 999),
        };
      }
    }
    const holidays = await Holiday.find(filter).sort({ date: 1 }).lean();
    res.json(holidays.map((h) => formatHoliday(h)));
  } catch (error) {
    console.error("List holidays error:", error);
    res.status(500).json({ msg: "Failed to fetch holidays" });
  }
});

// Upcoming holidays (for dashboard – auth)
router.get("/upcoming", auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidays = await Holiday.find({ date: { $gte: today } })
      .sort({ date: 1 })
      .limit(10)
      .lean();
    res.json(holidays.map((h) => formatHoliday(h)));
  } catch (error) {
    console.error("Upcoming holidays error:", error);
    res.status(500).json({ msg: "Failed to fetch upcoming holidays" });
  }
});

// Create holiday (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, date, description } = req.body;
    if (!name || !date) {
      return res.status(400).json({ msg: "Holiday name and date are required" });
    }
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ msg: "Invalid date format" });
    }
    d.setHours(0, 0, 0, 0);
    const holiday = await Holiday.create({
      name: name.trim(),
      date: d,
      description: (description || "").trim(),
    });
    res.status(201).json(formatHoliday(holiday));
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstMsg = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({ msg: firstMsg });
    }
    console.error("Create holiday error:", error);
    res.status(500).json({ msg: "Failed to create holiday" });
  }
});

// Update holiday (admin only)
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { name, date, description } = req.body;
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ msg: "Holiday not found" });
    }
    if (name !== undefined) holiday.name = name.trim();
    if (date !== undefined) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ msg: "Invalid date format" });
      }
      d.setHours(0, 0, 0, 0);
      holiday.date = d;
    }
    if (description !== undefined) holiday.description = description.trim();
    await holiday.save();
    res.json(formatHoliday(holiday));
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "Invalid holiday id" });
    }
    if (error.name === "ValidationError") {
      const firstMsg = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({ msg: firstMsg });
    }
    console.error("Update holiday error:", error);
    res.status(500).json({ msg: "Failed to update holiday" });
  }
});

// Delete holiday (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ msg: "Holiday not found" });
    }
    res.json({ msg: "Holiday deleted" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "Invalid holiday id" });
    }
    console.error("Delete holiday error:", error);
    res.status(500).json({ msg: "Failed to delete holiday" });
  }
});

module.exports = router;
