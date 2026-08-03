const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

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

let dbConnected = false;
async function ensureDB() {
  if (dbConnected || mongoose.connection.readyState === 1) {
    dbConnected = true;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    dbConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
}

ensureDB();

app.use("/api/auth", require("../backend/routes/authRoutes"));
app.use("/api/attendance", require("../backend/routes/attendanceRoutes"));
app.use("/api/leave", require("../backend/routes/leaveRoutes"));
app.use("/api/holidays", require("../backend/routes/holidayRoutes"));
app.use("/api/updates", require("../backend/routes/updateRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", db: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

module.exports = app;
