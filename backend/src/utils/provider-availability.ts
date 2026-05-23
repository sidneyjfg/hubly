import type { ProviderAvailability, PublicAvailableSlot } from "../types/provider";

const minutesStep = 15;

const toMinutes = (time: string): number => {
  const [hoursPart, minutesPart] = time.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  return hours * 60 + minutes;
};

const pad = (value: number): string => value.toString().padStart(2, "0");

const fromMinutes = (value: number): string => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${pad(hours)}:${pad(minutes)}`;
};

const buildIso = (date: string, time: string): string => `${date}T${time}:00.000Z`;

const getTimeZoneOffsetMs = (timeZone: string, date: Date): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = Number(values.get("year"));
  const month = Number(values.get("month"));
  const day = Number(values.get("day"));
  const hour = Number(values.get("hour"));
  const minute = Number(values.get("minute"));
  const second = Number(values.get("second"));

  return Date.UTC(year, month - 1, day, hour, minute, second) - date.getTime();
};

export const buildUtcDateFromLocalTime = (date: string, time: string, timeZone: string): Date => {
  const [yearPart, monthPart, dayPart] = date.split("-");
  const [hourPart, minutePart] = time.split(":");
  const localAsUtc = Date.UTC(
    Number(yearPart),
    Number(monthPart) - 1,
    Number(dayPart),
    Number(hourPart),
    Number(minutePart),
    0,
    0,
  );

  const firstGuess = new Date(localAsUtc - getTimeZoneOffsetMs(timeZone, new Date(localAsUtc)));
  return new Date(localAsUtc - getTimeZoneOffsetMs(timeZone, firstGuess));
};

export const buildUtcRangeForLocalDate = (date: string, timeZone: string): { start: Date; end: Date } => {
  const start = buildUtcDateFromLocalTime(date, "00:00", timeZone);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);

  return { start, end };
};

export const resolveWeekdayInTimeZone = (date: Date, timeZone: string): number => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
};

const toTimeInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get("hour")}:${values.get("minute")}`;
};

export const resolveWeekday = (date: string): number => {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay();
};

export const isWithinProviderAvailability = (
  availability: ProviderAvailability,
  startsAt: Date,
  endsAt: Date,
  timeZone = "UTC",
): boolean => {
  if (!availability.isActive) {
    return false;
  }

  const startMinutes = toMinutes(toTimeInTimeZone(startsAt, timeZone));
  const endMinutes = toMinutes(toTimeInTimeZone(endsAt, timeZone));
  const workStartMinutes = toMinutes(availability.workStart);
  const workEndMinutes = toMinutes(availability.workEnd);

  if (startMinutes < workStartMinutes || endMinutes > workEndMinutes) {
    return false;
  }

  if (!availability.lunchStart || !availability.lunchEnd) {
    return true;
  }

  const lunchStartMinutes = toMinutes(availability.lunchStart);
  const lunchEndMinutes = toMinutes(availability.lunchEnd);

  return endMinutes <= lunchStartMinutes || startMinutes >= lunchEndMinutes;
};

export const buildAvailableSlots = (
  date: string,
  availability: ProviderAvailability,
  durationMinutes: number,
  busyWindows: Array<{ startsAt: Date; endsAt: Date }>,
  timeZone = "UTC",
): PublicAvailableSlot[] => {
  if (!availability.isActive) {
    return [];
  }

  const workStartMinutes = toMinutes(availability.workStart);
  const workEndMinutes = toMinutes(availability.workEnd);
  const segments: Array<{ start: number; end: number }> = [];

  if (availability.lunchStart && availability.lunchEnd) {
    segments.push({ start: workStartMinutes, end: toMinutes(availability.lunchStart) });
    segments.push({ start: toMinutes(availability.lunchEnd), end: workEndMinutes });
  } else {
    segments.push({ start: workStartMinutes, end: workEndMinutes });
  }

  const slots: PublicAvailableSlot[] = [];

  for (const segment of segments) {
    for (let current = segment.start; current + durationMinutes <= segment.end; current += minutesStep) {
      const label = fromMinutes(current);
      const slotStart = timeZone === "UTC"
        ? new Date(buildIso(date, label))
        : buildUtcDateFromLocalTime(date, label, timeZone);
      const slotEndTime = fromMinutes(current + durationMinutes);
      const slotEnd = timeZone === "UTC"
        ? new Date(buildIso(date, slotEndTime))
        : buildUtcDateFromLocalTime(date, slotEndTime, timeZone);
      const overlapsBusyWindow = busyWindows.some(
        (busyWindow) => slotStart < busyWindow.endsAt && slotEnd > busyWindow.startsAt,
      );

      if (!overlapsBusyWindow) {
        slots.push({
          startsAt: slotStart.toISOString(),
          endsAt: slotEnd.toISOString(),
          label,
        });
      }
    }
  }

  return slots;
};
