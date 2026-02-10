

const OFFICE_START_HOUR = 10;
const OFFICE_START_MINUTE = 5;
const REQUIRED_WORK_MINUTES = 9 * 60;


export function toDate(value) {
  if (value == null) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getOfficeStartForDate(date) {
  const d = new Date(date);
  d.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE, 0, 0);
  return d;
}


export function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.max(0, Math.round(ms / (60 * 1000)));
}

export function getAttendanceStatus(checkIn, checkOut) {
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

  function formatMinutesToHours(minutes) {
    if (!minutes || minutes <= 0) return "0 min";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs} hr ${mins} min`;
    }
    if (hrs > 0) {
      return `${hrs} hr`;
    }
    if (mins > 0) {
      return `${mins} min`;
    }
    return "0 min";
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
          ? `Checked in ${formatMinutesToHours(lateMinutes)} late (no check-out yet)`
          : "Checked in on time (no check-out yet)",
    };
  }

  const totalWorkMinutes = minutesBetween(cin, cout);


  const lateWaived = totalWorkMinutes >= REQUIRED_WORK_MINUTES;
  const lateMinutes = lateWaived ? 0 : isAfterOfficeStart ? rawLateMinutes : 0;
  const isLate = lateMinutes > 0;
  const lateBy = formatMinutesToHours(lateMinutes);
  

  let statusMessage;
  if (lateWaived && isAfterOfficeStart) {
    statusMessage = "Present (late waived – 9+ hours worked)";
  } else if (isLate) {
    statusMessage = `Late by ${lateBy}`;
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

export { REQUIRED_WORK_MINUTES, OFFICE_START_HOUR, OFFICE_START_MINUTE };
