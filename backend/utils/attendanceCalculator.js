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

  const totalWorkMinutes = minutesBetween(cin, cout);

  return {
    totalWorkMinutes,
    statusMessage: "Present",
  };
}


module.exports = {
  getAttendanceStatus,
  minutesBetween,
  toDate,
  REQUIRED_WORK_MINUTES,
};
