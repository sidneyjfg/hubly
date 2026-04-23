import { z } from "zod";

import { ProfessionalServicesRepository } from "../repositories/professional-services.repository";
import { ProfessionalsRepository } from "../repositories/professionals.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { ProfessionalService, ProfessionalServiceWriteInput } from "../types/professional";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";

const professionalServiceWriteSchema = z.object({
  professionalId: z.string().min(3),
  name: z.string().min(2).max(120),
  durationMinutes: z.number().int().min(5).max(720),
  priceCents: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

export class ProfessionalServicesService {
  public constructor(
    private readonly servicesRepository: ProfessionalServicesRepository,
    private readonly professionalsRepository: ProfessionalsRepository,
  ) {}

  public async list(
    user: AuthenticatedRequestUser,
    query: PaginationInput & { professionalId?: string } = {},
  ): Promise<PaginatedResult<ProfessionalService>> {
    return this.servicesRepository.findAll(user.clinicId, {
      pagination: parsePagination(query),
      ...(query.professionalId === undefined ? {} : { professionalId: query.professionalId }),
    });
  }

  public async create(user: AuthenticatedRequestUser, input: ProfessionalServiceWriteInput): Promise<ProfessionalService> {
    const data = professionalServiceWriteSchema.parse(input);
    await this.ensureProfessional(user, data.professionalId);

    return this.servicesRepository.create(user.clinicId, {
      professionalId: data.professionalId,
      name: data.name,
      durationMinutes: data.durationMinutes,
      priceCents: data.priceCents ?? null,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });
  }

  public async update(
    user: AuthenticatedRequestUser,
    id: string,
    input: ProfessionalServiceWriteInput,
  ): Promise<ProfessionalService> {
    const data = professionalServiceWriteSchema.parse(input);
    await this.ensureProfessional(user, data.professionalId);

    const service = await this.servicesRepository.updateInClinic(user.clinicId, id, {
      professionalId: data.professionalId,
      name: data.name,
      durationMinutes: data.durationMinutes,
      priceCents: data.priceCents ?? null,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });

    if (!service) {
      throw new AppError("professional_services.not_found", "Serviço não encontrado.", 404);
    }

    return service;
  }

  public async setStatus(user: AuthenticatedRequestUser, id: string, isActive: boolean): Promise<ProfessionalService> {
    const service = await this.servicesRepository.setActiveInClinic(user.clinicId, id, isActive);

    if (!service) {
      throw new AppError("professional_services.not_found", "Serviço não encontrado.", 404);
    }

    return service;
  }

  private async ensureProfessional(user: AuthenticatedRequestUser, professionalId: string): Promise<void> {
    const professional = await this.professionalsRepository.findByIdInClinic(user.clinicId, professionalId);

    if (!professional) {
      throw new AppError("professionals.not_found", "Profissional não encontrado.", 404);
    }
  }
}
