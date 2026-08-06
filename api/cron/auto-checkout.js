const connectDB = require("../../backend/config/db");

module.exports = async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await connectDB();
    const Attendance = require("../../backend/models/Attendance");

    const now = new Date();
    const istDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const checkout = new Date(istDate + "T19:00:00+05:30");

    const result = await Attendance.updateMany(
      { checkOut: null },
      { $set: { checkOut: checkout, status: "Out" } }
    );

    const msg = result.modifiedCount > 0
      ? `Closed ${result.modifiedCount} open sessions at 7 PM IST`
      : "No open sessions to close";

    console.log(`[Auto-Checkout] ${msg}`);
    res.json({ success: true, message: msg, closed: result.modifiedCount });
  } catch (err) {
    console.error("[Auto-Checkout] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
