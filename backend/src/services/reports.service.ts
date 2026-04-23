import { AppointmentsRepository } from "../repositories/appointments.repository";
import type { AuthenticatedRequestUser } from "../types/auth";

const normalizeDateLike = (value: string): string => value.slice(0, 10);

export class ReportsService {
  public constructor(private readonly appointmentsRepository: AppointmentsRepository) {}

  public async listCatalog(): Promise<{ items: readonly string[] }> {
    return {
      items: ["daily-schedule", "weekly-schedule", "no-show-overview"] as const,
    };
  }

  public async getNoShowOverview(
    user: AuthenticatedRequestUser,
    input: { from: string; to: string },
  ) {
    const periodStart = new Date(`${normalizeDateLike(input.from)}T00:00:00.000Z`);
    const periodEnd = new Date(`${normalizeDateLike(input.to)}T00:00:00.000Z`);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 1);

    return this.appointmentsRepository.buildNoShowOverview(user.clinicId, periodStart, periodEnd);
  }
}
