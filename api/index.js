const express = require("express");
const cors = require("cors");
const connectDB = require("../backend/config/db");
require("dotenv").config({ path: "./backend/.env" });

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

connectDB();

app.use("/api/auth", require("../backend/routes/authRoutes"));
app.use("/api/attendance", require("../backend/routes/attendanceRoutes"));
app.use("/api/leave", require("../backend/routes/leaveRoutes"));
app.use("/api/holidays", require("../backend/routes/holidayRoutes"));
app.use("/api/updates", require("../backend/routes/updateRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

module.exports = app;
