const express = require("express");
const cors = require("cors");
const connectDB = require("../backend/config/db");

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3005",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

let dbReady = connectDB().catch(err => {
  console.error("Initial DB connection failed:", err.message);
});

app.use(async (req, res, next) => {
  const mongoose = require("mongoose");
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({ msg: "Database unavailable", error: err.message });
    }
  }
  next();
});

app.use("/api/auth", require("../backend/routes/authRoutes"));
app.use("/api/attendance", require("../backend/routes/attendanceRoutes"));
app.use("/api/leave", require("../backend/routes/leaveRoutes"));
app.use("/api/holidays", require("../backend/routes/holidayRoutes"));
app.use("/api/updates", require("../backend/routes/updateRoutes"));

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "OK",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

module.exports = app;
