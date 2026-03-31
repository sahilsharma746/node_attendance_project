const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(cors({
  origin: [
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

const PORT = process.env.PORT || 3004;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

