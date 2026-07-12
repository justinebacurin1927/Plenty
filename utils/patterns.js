// ─── Hourly Distribution (B1) ─────────────────────────

export function getHourlyDistribution(logs) {
  const hourly = Array(24).fill(0);
  logs.forEach((entry) => {
    const h = new Date(entry.timestamp).getHours();
    hourly[h]++;
  });
  return hourly;
}

// ─── Peak Hours (B2) ─────────────────────────────────

export function getPeakHours(logs) {
  const hourly = getHourlyDistribution(logs);
  const withIndex = hourly.map((count, hour) => ({ hour, count }));
  const sorted = withIndex.sort((a, b) => b.count - a.count);

  const result = [];
  for (const entry of sorted.slice(0, 3)) {
    if (entry.count === 0) break;
    const start = entry.hour;
    const end = (entry.hour + 1) % 24;
    const label = `${String(start).padStart(2, "0")}:00-${String(end).padStart(2, "0")}:00`;
    result.push({ hour: entry.hour, count: entry.count, label });
  }
  return result;
}

export function getPeakHoursSummary(logs) {
  const peaks = getPeakHours(logs);
  if (peaks.length === 0) return null;

  const primary = peaks[0];
  const secondary = peaks[1];

  let text = `You drink most around ${primary.label}`;
  if (secondary && secondary.count > 0) {
    text += ` and ${secondary.label}`;
  }
  return text;
}

// ─── Lull Detection (B3) ─────────────────────────────

export function getLullPeriods(logs) {
  const hourly = getHourlyDistribution(logs);
  const maxCount = Math.max(...hourly, 1);
  const threshold = maxCount * 0.3; // 30% of peak = lull

  const lulls = [];
  let inLull = false;
  let lullStart = null;

  for (let h = 0; h < 24; h++) {
    if (hourly[h] <= threshold && hourly[h] > 0) {
      if (!inLull) {
        inLull = true;
        lullStart = h;
      }
    } else {
      if (inLull && lullStart !== null && h - lullStart >= 2) {
        lulls.push({
          start: lullStart,
          end: h - 1,
          label: `${String(lullStart).padStart(2, "0")}:00-${String(h).padStart(2, "0")}:00`,
          severity: hourly[lullStart] === 0 ? "gap" : "low",
        });
      }
      inLull = false;
      lullStart = null;
    }
  }

  // Check if lull runs past midnight
  if (inLull && lullStart !== null && 24 - lullStart >= 2) {
    lulls.push({
      start: lullStart,
      end: 23,
      label: `${String(lullStart).padStart(2, "0")}:00-23:00`,
      severity: hourly[lullStart] === 0 ? "gap" : "low",
    });
  }

  return lulls;
}

// ─── Day-of-Week Patterns (B5) ───────────────────────

export function getDayOfWeekPatterns(logs) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  logs.forEach((entry) => {
    const d = new Date(entry.timestamp);
    const day = d.getDay();
    dayTotals[day] += entry.amount || 250;
    dayCounts[day]++;
  });

  const totalDays = Math.max(...dayCounts.filter((c) => c > 0));
  const maxAvg = Math.max(...dayTotals.map((t, i) => (dayCounts[i] > 0 ? t / dayCounts[i] : 0)), 1);

  return dayNames.map((name, i) => ({
    name,
    total: dayTotals[i],
    count: dayCounts[i],
    avg: dayCounts[i] > 0 ? Math.round(dayTotals[i] / dayCounts[i]) : 0,
    pctOfMax: dayCounts[i] > 0 ? Math.round((dayTotals[i] / dayCounts[i] / maxAvg) * 100) : 0,
  }));
}

export function getLowestHydrationDay(logs) {
  const patterns = getDayOfWeekPatterns(logs);
  const withData = patterns.filter((d) => d.count > 0);
  if (withData.length === 0) return null;

  return withData.reduce((a, b) => (a.avg < b.avg ? a : b));
}

// ─── Pattern Summary ─────────────────────────────────

export function getPatternSummary(logs) {
  if (logs.length < 5) return null;

  const peaks = getPeakHours(logs);
  const lulls = getLullPeriods(logs);
  const lowestDay = getLowestHydrationDay(logs);

  const parts = [];

  if (peaks.length > 0) {
    parts.push(`Peak: ${peaks[0].label}`);
  }

  if (lulls.length > 0) {
    const significant = lulls.filter((l) => l.severity === "gap");
    if (significant.length > 0) {
      parts.push(`Gap: ${significant[0].label}`);
    }
  }

  if (lowestDay) {
    parts.push(`Low: ${lowestDay.name}s (avg ${lowestDay.avg}ml)`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
