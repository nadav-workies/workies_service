import { getWeekStart, addDays } from "@/lib/maintenanceConfig";

export const DEFAULT_WORKERS = ["עטיה", "תייסיר"];

export const toMinutes = (t) => {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const weekDates = (weekStart) => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

export const windowsForDate = (windows, date) =>
  windows.filter(w => w.date === date).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

export const openWindowsForDate = (windows, date) =>
  windowsForDate(windows, date).filter(w => (w.availability || "available") === "available");

/** Windows in which a specific worker can be scheduled on a date */
export const workerWindowsForDate = (windows, date, worker) =>
  openWindowsForDate(windows, date).filter(w =>
    !w.available_workers?.length || w.available_workers.includes(worker)
  );

/** Does a task time fall inside an open window with that worker available? */
export const findMatchingWindow = (windows, date, startTime, worker) => {
  const start = toMinutes(startTime);
  return workerWindowsForDate(windows, date, worker).find(w => {
    const ws = toMinutes(w.start_time), we = toMinutes(w.end_time);
    if (ws === null || we === null) return true;
    if (start === null) return true;
    return start >= ws && start < we;
  }) || null;
};

export const isScheduleAllowed = (windows, date, startTime, worker) =>
  !!findMatchingWindow(windows, date, startTime, worker);

/** Latest earlier week that has windows defined — used for weekly carry-forward */
export const latestDefinedWeekBefore = (windows, weekStart) => {
  const weeks = Array.from(new Set(windows.map(w => w.week_start_date || getWeekStart(w.date))))
    .filter(w => w && w < weekStart)
    .sort();
  return weeks[weeks.length - 1] || null;
};

/** Build copies of a source week's windows onto the target week */
export const buildCarryForwardWindows = (windows, sourceWeek, targetWeek) => {
  const src = windows.filter(w => (w.week_start_date || getWeekStart(w.date)) === sourceWeek);
  const srcDates = weekDates(sourceWeek);
  const tgtDates = weekDates(targetWeek);
  return src.map(w => {
    const idx = srcDates.indexOf(w.date);
    if (idx < 0) return null;
    return {
      date: tgtDates[idx],
      week_start_date: targetWeek,
      start_time: w.start_time || "09:00",
      end_time: w.end_time || "12:00",
      availability: w.availability || "available",
      available_workers: w.available_workers || [],
      note: w.note || "",
      copied_from_week: sourceWeek,
    };
  }).filter(Boolean);
};