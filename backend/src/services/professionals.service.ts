import { z } from "zod";

import { ProfessionalsRepository } from "../repositories/professionals.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Professional } from "../types/professional";
import type { ProfessionalWriteInput } from "../types/professional";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";

const professionalWriteSchema = z.object({
  fullName: z.string().min(3).max(120),
  specialty: z.string().min(2).max(120),
  isActive: z.boolean().optional(),
});

export class ProfessionalsService {
  public constructor(private readonly professionalsRepository: ProfessionalsRepository) {}

  public async list(
    user: AuthenticatedRequestUser,
    paginationInput: PaginationInput = {},
  ): Promise<PaginatedResult<Professional>> {
    return this.professionalsRepository.findAll(user.clinicId, parsePagination(paginationInput));
  }

  public async create(user: AuthenticatedRequestUser, input: ProfessionalWriteInput): Promise<Professional> {
    const data = professionalWriteSchema.parse(input);
    return this.professionalsRepository.create(user.clinicId, {
      fullName: data.fullName,
      specialty: data.specialty,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });
  }

  public async update(user: AuthenticatedRequestUser, id: string, input: ProfessionalWriteInput): Promise<Professional> {
    const data = professionalWriteSchema.parse(input);
    const professional = await this.professionalsRepository.updateInClinic(user.clinicId, id, {
      fullName: data.fullName,
      specialty: data.specialty,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });

    if (!professional) {
      throw new AppError("professionals.not_found", "Professional not found.", 404);
    }

    return professional;
  }

  public async setStatus(user: AuthenticatedRequestUser, id: string, isActive: boolean): Promise<Professional> {
    const professional = await this.professionalsRepository.setActiveInClinic(user.clinicId, id, isActive);

    if (!professional) {
      throw new AppError("professionals.not_found", "Professional not found.", 404);
    }

    return professional;
  }
}
