const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

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

app.use("/api/auth", require("./routes/authRoutes")); 
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leave", require("./routes/leaveRoutes"));
app.use("/api/holidays", require("./routes/holidayRoutes"));
app.use("/api/updates", require("./routes/updateRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Auto-checkout: close all open sessions at 7 PM IST daily
const Attendance = require("./models/Attendance");

function scheduleAutoCheckout() {
  const run = async () => {
    try {
      const now = new Date();
      const istDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const checkout = new Date(istDate + "T19:00:00+05:30");

      const result = await Attendance.updateMany(
        { checkOut: null },
        { $set: { checkOut: checkout, status: "Out" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Auto-Checkout] Closed ${result.modifiedCount} open sessions at 7 PM IST`);
      }
    } catch (err) {
      console.error("[Auto-Checkout] Error:", err.message);
    }
  };

  function msUntilNext7PM() {
    const now = new Date();
    const istStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const target = new Date(istStr + "T19:00:00+05:30");
    let diff = target.getTime() - now.getTime();
    if (diff <= 0) diff += 24 * 60 * 60 * 1000;
    return diff;
  }

  function schedule() {
    const delay = msUntilNext7PM();
    const hours = Math.round(delay / 3600000 * 10) / 10;
    console.log(`[Auto-Checkout] Next run in ${hours} hours`);
    setTimeout(() => {
      run();
      setInterval(run, 24 * 60 * 60 * 1000);
    }, delay);
  }

  schedule();
}

scheduleAutoCheckout();

const PORT = process.env.PORT || 3004;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

