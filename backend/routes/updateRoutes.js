const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/auth").adminAuth;
const Update = require("../models/Update");

function formatUpdate(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    _id: d._id,
    title: d.title,
    content: d.content || "",
    createdAt: d.createdAt,
    createdBy: d.createdBy,
  };
}

// List latest updates (any authenticated user)
router.get("/", auth, async (req, res) => {
  try {
    const updates = await Update.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("createdBy", "name")
      .lean();
    res.json(
      updates.map((u) => ({
        ...formatUpdate(u),
        createdByName: u.createdBy?.name || "Admin",
      }))
    );
  } catch (error) {
    console.error("List updates error:", error);
    res.status(500).json({ msg: "Failed to fetch updates" });
  }
});

// Create update (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ msg: "Title is required" });
    }
    const update = await Update.create({
      title: title.trim(),
      content: (content || "").trim(),
      createdBy: req.user.id,
    });
    const populated = await Update.findById(update._id)
      .populate("createdBy", "name")
      .lean();
    res.status(201).json({
      ...formatUpdate(populated),
      createdByName: populated.createdBy?.name || "Admin",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstMsg = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({ msg: firstMsg });
    }
    console.error("Create update error:", error);
    res.status(500).json({ msg: "Failed to create update" });
  }
});

// Update (admin only)
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const update = await Update.findById(req.params.id);
    if (!update) {
      return res.status(404).json({ msg: "Update not found" });
    }
    if (title !== undefined) update.title = title.trim();
    if (content !== undefined) update.content = content.trim();
    await update.save();
    const populated = await Update.findById(update._id)
      .populate("createdBy", "name")
      .lean();
    res.json({
      ...formatUpdate(populated),
      createdByName: populated.createdBy?.name || "Admin",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "Invalid update id" });
    }
    if (error.name === "ValidationError") {
      const firstMsg = Object.values(error.errors)[0]?.message || error.message;
      return res.status(400).json({ msg: firstMsg });
    }
    console.error("Update error:", error);
    res.status(500).json({ msg: "Failed to update" });
  }
});

// Delete (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const update = await Update.findByIdAndDelete(req.params.id);
    if (!update) {
      return res.status(404).json({ msg: "Update not found" });
    }
    res.json({ msg: "Update deleted" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ msg: "Invalid update id" });
    }
    console.error("Delete update error:", error);
    res.status(500).json({ msg: "Failed to delete update" });
  }
});

module.exports = router;
