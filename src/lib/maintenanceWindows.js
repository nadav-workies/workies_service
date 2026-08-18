import { getWeekStart, addDays } from "@/lib/maintenanceConfig";

export const DEFAULT_WORKERS = ["עטיה", "תייסיר"];

export const toMinutes = (t) => {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Weekly work calendar helpers (per worker: days + hours) */
export const DEFAULT_SHIFT = { start_time: "09:00", end_time: "17:00" };

export const normalizeSchedule = (schedule) =>
  Array.from({ length: 7 }, (_, d) => {
    const row = (schedule || []).find(r => Number(r.day_of_week) === d);
    return {
      day_of_week: d,
      is_working: row ? !!row.is_working : d >= 0 && d <= 4,
      start_time: row?.start_time || DEFAULT_SHIFT.start_time,
      end_time: row?.end_time || DEFAULT_SHIFT.end_time,
    };
  });

/** The worker's shift on a given date, or null when they don't work that day */
export const workerShiftForDate = (workerRecord, date) => {
  if (!date) return null;
  const day = new Date(`${date}T00:00:00`).getDay();
  const row = normalizeSchedule(workerRecord?.work_schedule)[day];
  return row?.is_working ? row : null;
};

export const isWithinShift = (shift, startTime) => {
  if (!shift) return false;
  const s = toMinutes(startTime), ws = toMinutes(shift.start_time), we = toMinutes(shift.end_time);
  if (s === null || ws === null || we === null) return true;
  return s >= ws && s < we;
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