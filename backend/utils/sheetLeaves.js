const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSQUEIAgNDsFbsV3OZP9AR1FuLMq69pD3PZpwbNVAoo2b5oakOu4kunO531mBHlqzFpry_YEQ3_zmxl/pub?output=csv';

const SHEET_TABS = [
  { gid: '1522708638', label: 'Jan 2026' },
  { gid: '785195875', label: 'Feb 2026' },
  { gid: '1743297083', label: 'Mar 2026' },
  { gid: '2030559275', label: 'Apr 2026' },
  { gid: '82450032', label: 'May 2026' },
];

const LEAVE_VALUES = ['ML', 'EL', 'CL', 'SL', 'L', 'PL', 'LEAVE'];

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else current += line[i];
    }
    result.push(current.trim());
    return result;
  };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
}

let _cache = { data: null, ts: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getSheetLeaveCounts() {
  if (_cache.data && (Date.now() - _cache.ts) < CACHE_TTL) return _cache.data;
  const now = new Date();
  const currentMonthIdx = now.getMonth(); // 0-based
  const monthMap = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4 };

  // Only fetch tabs up to current month
  const tabsToFetch = SHEET_TABS.filter(tab => {
    const parts = tab.label.split(' ');
    const tabMonth = monthMap[parts[0]];
    return tabMonth !== undefined && tabMonth <= currentMonthIdx;
  });

  // employeeName (lowercase first name) -> total leave days
  // Also track full names for more precise matching
  const leaveCounts = {};
  const leaveCountsByFullName = {};

  for (const tab of tabsToFetch) {
    try {
      const url = `${SHEET_CSV_URL}&gid=${tab.gid}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      const { headers, rows } = parseCSV(text);

      const dateIndices = headers
        .map((h, i) => (/^\d{1,2}-/.test(h) ? i : -1))
        .filter(i => i >= 0);

      rows.forEach(row => {
        const fullName = (row[0] || '').trim();
        if (!fullName) return;
        const firstName = fullName.split(' ')[0].toLowerCase();

        let leaveCount = 0;
        dateIndices.forEach(di => {
          const val = (row[di] || '').toUpperCase().trim();
          if (LEAVE_VALUES.includes(val)) leaveCount++;
        });

        if (leaveCount > 0) {
          leaveCounts[firstName] = (leaveCounts[firstName] || 0) + leaveCount;
          const fullNameLower = fullName.toLowerCase();
          leaveCountsByFullName[fullNameLower] = (leaveCountsByFullName[fullNameLower] || 0) + leaveCount;
        }
      });
    } catch (err) {
      console.error(`Failed to fetch sheet tab ${tab.label}:`, err.message);
    }
  }

  _cache = { data: leaveCounts, byFullName: leaveCountsByFullName, ts: Date.now() };
  return leaveCounts;
}

async function getSheetLeaveForUser(fullName) {
  await getSheetLeaveCounts(); // ensure cache is populated
  const fullNameLower = (fullName || "").toLowerCase().trim();
  const firstName = fullNameLower.split(" ")[0];

  // Try full name match first (more precise)
  if (_cache.byFullName && _cache.byFullName[fullNameLower]) {
    return _cache.byFullName[fullNameLower];
  }
  // Fallback to first name match only if no full name match
  if (_cache.data && _cache.data[firstName]) {
    return _cache.data[firstName];
  }
  return 0;
}

module.exports = { getSheetLeaveCounts, getSheetLeaveForUser };
