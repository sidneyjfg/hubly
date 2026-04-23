import { z } from "zod";

import { ClinicsRepository } from "../repositories/clinics.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Clinic, ClinicWriteInput } from "../types/clinic";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";

const clinicWriteSchema = z.object({
  legalName: z.string().min(3).max(160),
  tradeName: z.string().min(3).max(160),
  timezone: z.string().min(3).max(60),
});

export class ClinicsService {
  public constructor(private readonly clinicsRepository: ClinicsRepository) {}

  public async list(user: AuthenticatedRequestUser, paginationInput: PaginationInput = {}): Promise<PaginatedResult<Clinic>> {
    return this.clinicsRepository.findAll(parsePagination(paginationInput), user.clinicId);
  }

  public async create(input: ClinicWriteInput): Promise<Clinic> {
    const data = clinicWriteSchema.parse(input);
    return this.clinicsRepository.create(data);
  }

  public async update(user: AuthenticatedRequestUser, id: string, input: ClinicWriteInput): Promise<Clinic> {
    const data = clinicWriteSchema.parse(input);
    const clinic = await this.clinicsRepository.updateInClinic(user.clinicId, id, data);

    if (!clinic) {
      throw new AppError("clinics.not_found", "Clinic not found.", 404);
    }

    return clinic;
  }
}
