const REQUIRED_WORK_MINUTES = 9 * 60;

function toDate(value) {
  if (value == null) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / (60 * 1000)));
}

function getAttendanceStatus(checkIn, checkOut) {
  const cin = toDate(checkIn);
  const cout = toDate(checkOut);

  if (!cin) {
    return {
      totalWorkMinutes: 0,
      statusMessage: "No check-in recorded",
    };
  }

  if (cout == null) {
    return {
      totalWorkMinutes: 0,
      statusMessage: "Checked in (no check-out yet)",
    };
  }

  let totalWorkMinutes = minutesBetween(cin, cout);
  // Cap at 18 hours (1080 min) — if higher, recalculate using same-day IST times
  if (totalWorkMinutes > 1080) {
    const cinIST = cin.toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Kolkata" });
    const coutIST = cout.toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Kolkata" });
    const [ch, cm] = cinIST.split(":").map(Number);
    const [oh, om] = coutIST.split(":").map(Number);
    totalWorkMinutes = Math.max(0, (oh * 60 + om) - (ch * 60 + cm));
  }
  const hrs = Math.floor(totalWorkMinutes / 60);
  const mins = totalWorkMinutes % 60;
  const workDisplay = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  return {
    totalWorkMinutes,
    statusMessage: `Completed (${workDisplay})`,
  };
}


module.exports = {
  getAttendanceStatus,
  minutesBetween,
  toDate,
  REQUIRED_WORK_MINUTES,
};
