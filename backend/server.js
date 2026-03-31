const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors());

connectDB();

app.use("/api/auth", require("./routes/authRoutes")); 
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leave", require("./routes/leaveRoutes"));
app.use("/api/holidays", require("./routes/holidayRoutes"));
app.use("/api/updates", require("./routes/updateRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Test email route
app.get("/api/test-email", async (req, res) => {
  try {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.NOTIFY_EMAIL,
      subject: "Test Email - Attendance System",
      html: "<h2>It works!</h2><p>Email notifications are configured correctly.</p>",
    });
    console.log("Test email result:", result);
    res.json({ status: "OK", result });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ status: "FAILED", error: error.message });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
