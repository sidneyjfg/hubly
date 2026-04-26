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

export const resolveWeekday = (date: string): number => {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay();
};

export const isWithinProviderAvailability = (
  availability: ProviderAvailability,
  startsAt: Date,
  endsAt: Date,
): boolean => {
  if (!availability.isActive) {
    return false;
  }

  const startMinutes = startsAt.getUTCHours() * 60 + startsAt.getUTCMinutes();
  const endMinutes = endsAt.getUTCHours() * 60 + endsAt.getUTCMinutes();
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
      const slotStart = new Date(buildIso(date, fromMinutes(current)));
      const slotEnd = new Date(buildIso(date, fromMinutes(current + durationMinutes)));
      const overlapsBusyWindow = busyWindows.some(
        (busyWindow) => slotStart < busyWindow.endsAt && slotEnd > busyWindow.startsAt,
      );

      if (!overlapsBusyWindow) {
        slots.push({
          startsAt: slotStart.toISOString(),
          endsAt: slotEnd.toISOString(),
          label: fromMinutes(current),
        });
      }
    }
  }

  return slots;
};
