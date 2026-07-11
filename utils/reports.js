import { getLogs, getMonthlyCache, setMonthlyCache } from "./storage";

// ─── Helpers ─────────────────────────────────────────

function dateKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Monthly Report Generator (A1) ─────────────────────

export function generateMonthlyReportData(logs, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  // Filter logs for this month
  const monthLogs = logs.filter((entry) => {
    const t = new Date(entry.timestamp);
    return t >= start && t <= end;
  });

  if (monthLogs.length === 0) return null;

  // Basic aggregates
  const totalGlasses = monthLogs.length;
  const totalMl = monthLogs.reduce((sum, e) => sum + (e.amount || 250), 0);
  const avgPerDay = totalGlasses / new Date(year, month, 0).getDate();

  // Days active
  const activeDays = new Set();
  const dayTotals = {};
  monthLogs.forEach((entry) => {
    const d = new Date(entry.timestamp);
    const key = dateKey(d.getFullYear(), d.getMonth() + 1) + "-" + String(d.getDate()).padStart(2, "0");
    activeDays.add(key);
    dayTotals[key] = (dayTotals[key] || 0) + (entry.amount || 250);
  });

  // Best streak
  const sortedDays = Array.from(activeDays).sort();
  let bestStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = (curr - prev) / 86400000;
    if (diffDays === 1) {
      currentStreak++;
    } else {
      bestStreak = Math.max(bestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  // Goal hits (days that met or exceeded dailyGoal glasses)
  const dailyGoal = 8; // default, we'll pass from settings later
  let goalHits = 0;
  let goalMisses = 0;
  for (const [day, totalMlDay] of Object.entries(dayTotals)) {
    if (totalMlDay >= dailyGoal * 250) goalHits++;
    else goalMisses++;
  }

  // Peak hour (hour with most logs)
  const hourly = Array(24).fill(0);
  monthLogs.forEach((entry) => {
    const h = new Date(entry.timestamp).getHours();
    hourly[h]++;
  });
  const peakHour = hourly.indexOf(Math.max(...hourly));

  // Best day (highest ml)
  let bestDay = null;
  let bestDayMl = 0;
  for (const [day, total] of Object.entries(dayTotals)) {
    if (total > bestDayMl) {
      bestDayMl = total;
      bestDay = day;
    }
  }

  // Lowest day
  let lowestDay = null;
  let lowestDayMl = Infinity;
  for (const [day, total] of Object.entries(dayTotals)) {
    if (total < lowestDayMl) {
      lowestDayMl = total;
      lowestDay = day;
    }
  }

  return {
    year,
    month,
    label: `${start.toLocaleString("default", { month: "long" })} ${year}`,
    totalGlasses,
    totalMl,
    daysActive: activeDays.size,
    totalDays: new Date(year, month, 0).getDate(),
    avgPerDay: Math.round(avgPerDay * 10) / 10,
    bestStreak,
    goalHits,
    goalMisses,
    peakHour: `${peakHour}:00-${peakHour + 1}:00`,
    bestDay,
    bestDayMl,
    lowestDay,
    lowestDayMl,
  };
}

// ─── Cached Report Loader (A2) ────────────────────────

export async function getCachedMonthlyReport(year, month) {
  const cache = await getMonthlyCache();
  const key = dateKey(year, month);
  return cache[key] || null;
}

export async function getOrGenerateMonthlyReport(year, month) {
  const cache = await getMonthlyCache();
  const key = dateKey(year, month);
  if (cache[key]) return cache[key];

  const logs = await getLogs();
  const report = generateMonthlyReportData(logs, year, month);
  if (!report) return null;

  // Keep last 3 reports in cache
  const updated = { ...cache, [key]: report };
  const keys = Object.keys(updated).sort();
  if (keys.length > 3) {
    delete updated[keys[0]];
  }
  await setMonthlyCache(updated);
  return report;
}

export async function getCurrentMonthReport() {
  const now = new Date();
  return await getOrGenerateMonthlyReport(now.getFullYear(), now.getMonth() + 1);
}

export async function getLast3MonthsReports() {
  const now = new Date();
  const reports = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const report = await getOrGenerateMonthlyReport(d.getFullYear(), d.getMonth() + 1);
    if (report) reports.push(report);
  }
  return reports;
}

// ─── Quarterly Trends (A4) ─────────────────────────────

export async function getQuarterlyTrends() {
  const reports = await getLast3MonthsReports();
  if (reports.length < 2) return null;

  const current = reports[0];
  const previous = reports[1];

  const diff = current.avgPerDay - previous.avgPerDay;
  const pctChange = previous.avgPerDay > 0
    ? Math.round((diff / previous.avgPerDay) * 100)
    : 0;

  return {
    current,
    previous,
    diff,
    pctChange,
    trend: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
  };
}

// ─── Highlight Callouts (A5) ──────────────────────────

export function getHighlights(report) {
  if (!report) return [];

  const highlights = [];

  if (report.bestStreak >= 7) {
    highlights.push({
      icon: "🔥",
      text: `Best streak ever: ${report.bestStreak} days!`,
    });
  } else if (report.bestStreak >= 3) {
    highlights.push({
      icon: "🔥",
      text: `Nice streak: ${report.bestStreak} days`,
    });
  }

  if (report.avgPerDay >= 8) {
    highlights.push({
      icon: "⭐",
      text: `Averaged ${report.avgPerDay} glasses/day — excellent!`,
    });
  } else if (report.avgPerDay >= 6) {
    highlights.push({
      icon: "💪",
      text: `Averaged ${report.avgPerDay} glasses/day`,
    });
  }

  if (report.goalHits > report.totalDays * 0.7) {
    highlights.push({
      icon: "🏆",
      text: `Hit your goal ${report.goalHits} out of ${report.totalDays} days`,
    });
  }

  if (report.bestDay) {
    const bestDate = new Date(report.bestDay);
    highlights.push({
      icon: "☀️",
      text: `Most hydrated day: ${bestDate.toLocaleDateString("default", { month: "short", day: "numeric" })}`,
    });
  }

  if (report.totalGlasses >= 200) {
    highlights.push({
      icon: "💧",
      text: `${report.totalGlasses} glasses logged — crushing it!`,
    });
  }

  return highlights;
}
