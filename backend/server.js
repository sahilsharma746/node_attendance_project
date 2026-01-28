const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

connectDB();

const app = express();

app.use(express.json());

app.use(cors());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
