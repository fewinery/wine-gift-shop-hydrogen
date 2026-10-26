/**
 * Start/end scheduling for promo labels and message banners.
 *
 * Editors type dates as text, always in US Pacific time (PST/PDT):
 *   "2026-11-01 23:59"  -> Nov 1 2026, 11:59 PM Pacific
 *   "2026-11-01"        -> Nov 1 2026, 12:00 AM Pacific
 *
 * Typed text is used instead of the Studio date picker because the picker
 * stores the time in the editor's own computer timezone; a team editing from
 * different cities would otherwise get different results.
 *
 * - Start empty -> live immediately.
 * - End empty   -> never expires.
 * - End is the moment it disappears ("2026-11-02 00:00" = gone at midnight).
 * - A date that can't be read hides the item on the live site (safer than
 *   showing a promo that may have ended) and is flagged in Studio.
 */

const PACIFIC = "America/Los_Angeles";
const DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T]+(\d{1,2}):(\d{2}))?$/;

export type ScheduleStatus = "active" | "scheduled" | "expired" | "invalid";

/** Minutes Pacific is ahead of UTC at `ts` (negative: -480 PST, -420 PDT). */
function pacificOffsetMinutes(ts: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const wallAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
  );
  return Math.round((wallAsUtc - ts) / 60_000);
}

/**
 * "YYYY-MM-DD HH:mm" in Pacific time -> epoch ms.
 * Returns null for an empty value and NaN for a value that can't be read.
 */
export function parsePacificDateTime(value?: string | null): number | null {
  const text = (value || "").trim();
  if (!text) {
    return null;
  }
  const m = DATE_RE.exec(text);
  if (!m) {
    return Number.NaN;
  }
  const [year, month, day, hour, minute] = [
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
    Number(m[4] ?? 0),
    Number(m[5] ?? 0),
  ];
  if (month < 1 || month > 12 || hour > 23 || minute > 59) {
    return Number.NaN;
  }
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  // Reject impossible days like 2026-02-30 (Date.UTC would roll them over).
  if (new Date(wallAsUtc).getUTCDate() !== day) {
    return Number.NaN;
  }
  // Two passes so times right next to a daylight-saving switch land correctly.
  let ts = wallAsUtc - pacificOffsetMinutes(wallAsUtc) * 60_000;
  ts = wallAsUtc - pacificOffsetMinutes(ts) * 60_000;
  return ts;
}

export function getScheduleStatus(
  start?: string | null,
  end?: string | null,
  now: number = Date.now(),
): ScheduleStatus {
  const startTs = parsePacificDateTime(start);
  const endTs = parsePacificDateTime(end);
  if (Number.isNaN(startTs) || Number.isNaN(endTs)) {
    return "invalid";
  }
  if (startTs !== null && now < startTs) {
    return "scheduled";
  }
  if (endTs !== null && now >= endTs) {
    return "expired";
  }
  return "active";
}

/** "Sun, Nov 1, 11:59 PM PT" — for the Studio-only status notes. */
export function formatPacific(value?: string | null): string {
  const ts = parsePacificDateTime(value);
  if (ts === null || Number.isNaN(ts)) {
    return "";
  }
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ts));
  return `${formatted} PT`;
}

/** One-line explanation of a schedule, shown only inside Studio. */
export function describeSchedule(
  start?: string | null,
  end?: string | null,
  now: number = Date.now(),
): string {
  const status = getScheduleStatus(start, end, now);
  if (status === "invalid") {
    return "Hidden: date not readable. Use YYYY-MM-DD HH:mm, e.g. 2026-11-01 23:59";
  }
  if (status === "scheduled") {
    return `Hidden until ${formatPacific(start)}`;
  }
  if (status === "expired") {
    return `Hidden: ended ${formatPacific(end)}`;
  }
  return end ? `Live until ${formatPacific(end)}` : "";
}
