/**
 * Attendance calculation utilities.
 * Business rules:
 * - Office start: 10:00 AM (on the same calendar day as check-in).
 * - Required work per day: 9 hours.
 * - Late = check-in after 10:00 AM; waived if total work >= 9 hours in the same day.
 */

const OFFICE_START_HOUR = 10;
const OFFICE_START_MINUTE = 0;
const REQUIRED_WORK_MINUTES = 9 * 60; // 9 hours

/**
 * Normalize a value to a Date (handles Date, ISO string, or timestamp).
 * @param {Date|string|number} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (value == null) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Get office start time (10:00 AM) on the same calendar day as the given date.
 * @param {Date} date
 * @returns {Date}
 */
function getOfficeStartForDate(date) {
  const d = new Date(date);
  d.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE, 0, 0);
  return d;
}

/**
 * Minutes between two dates (safe; returns 0 if invalid).
 * @param {Date} start
 * @param {Date} end
 * @returns {number}
 */
function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / (60 * 1000)));
}

/**
 * Compute attendance status from check-in and optional check-out.
 *
 * @param {Date|string|number|null} checkIn - Check-in time
 * @param {Date|string|number|null} checkOut - Check-out time (optional)
 * @returns {{
 *   isLate: boolean,
 *   lateMinutes: number,
 *   totalWorkMinutes: number,
 *   statusMessage: string
 * }}
 */
function getAttendanceStatus(checkIn, checkOut) {
  const cin = toDate(checkIn);
  const cout = toDate(checkOut);

  const noCheckIn = !cin;
  const noCheckOut = cout == null;

  if (noCheckIn) {
    return {
      isLate: false,
      lateMinutes: 0,
      totalWorkMinutes: 0,
      statusMessage: "No check-in recorded",
    };
  }

  const officeStart = getOfficeStartForDate(cin);
  const rawLateMinutes = minutesBetween(officeStart, cin);
  const isAfterOfficeStart = cin.getTime() > officeStart.getTime();

  if (noCheckOut) {
    const lateMinutes = isAfterOfficeStart ? rawLateMinutes : 0;
    return {
      isLate: lateMinutes > 0,
      lateMinutes,
      totalWorkMinutes: 0,
      statusMessage:
        lateMinutes > 0
          ? `Checked in ${lateMinutes} min late (no check-out yet)`
          : "Checked in on time (no check-out yet)",
    };
  }

  const totalWorkMinutes = minutesBetween(cin, cout);

  // Waiver: if total work >= 9 hours in the same day, late is waived
  const lateWaived = totalWorkMinutes >= REQUIRED_WORK_MINUTES;
  const lateMinutes = lateWaived ? 0 : isAfterOfficeStart ? rawLateMinutes : 0;
  const isLate = lateMinutes > 0;

  let statusMessage;
  if (lateWaived && isAfterOfficeStart) {
    statusMessage = "Present (late waived – 9+ hours worked)";
  } else if (isLate) {
    statusMessage = `Late by ${lateMinutes} min`;
  } else {
    statusMessage = "On time";
  }

  return {
    isLate,
    lateMinutes,
    totalWorkMinutes,
    statusMessage,
  };
}

module.exports = {
  getAttendanceStatus,
  getOfficeStartForDate,
  minutesBetween,
  toDate,
  REQUIRED_WORK_MINUTES,
  OFFICE_START_HOUR,
  OFFICE_START_MINUTE,
};
