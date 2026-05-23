import { z } from "zod";

import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { ServiceOffering, ServiceOfferingWriteInput } from "../types/provider";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";
import { PlanEntitlementsService } from "./plan-entitlements.service";

const providerServiceWriteSchema = z.object({
  providerId: z.string().min(3),
  name: z.string().min(2).max(120),
  durationMinutes: z.number().int().min(5).max(720),
  priceCents: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

export class ServiceOfferingsService {
  public constructor(
    private readonly servicesRepository: ServiceOfferingsRepository,
    private readonly providersRepository: ProvidersRepository,
    private readonly planEntitlementsService: PlanEntitlementsService,
  ) {}

  public async list(
    user: AuthenticatedRequestUser,
    query: PaginationInput & { providerId?: string } = {},
  ): Promise<PaginatedResult<ServiceOffering>> {
    return this.servicesRepository.findAll(user.organizationId, {
      pagination: parsePagination(query),
      ...(query.providerId === undefined ? {} : { providerId: query.providerId }),
    });
  }

  public async create(user: AuthenticatedRequestUser, input: ServiceOfferingWriteInput): Promise<ServiceOffering> {
    const data = providerServiceWriteSchema.parse(input);
    await this.ensureProvider(user, data.providerId);
    if (data.isActive !== false) {
      await this.planEntitlementsService.assertCanCreateServiceOffering(user.organizationId);
    }

    return this.servicesRepository.create(user.organizationId, {
      providerId: data.providerId,
      name: data.name,
      durationMinutes: data.durationMinutes,
      priceCents: data.priceCents ?? null,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });
  }

  public async update(
    user: AuthenticatedRequestUser,
    id: string,
    input: ServiceOfferingWriteInput,
  ): Promise<ServiceOffering> {
    const data = providerServiceWriteSchema.parse(input);
    await this.ensureProvider(user, data.providerId);
    const currentService = await this.servicesRepository.findByIdInOrganization(user.organizationId, id);

    if (!currentService) {
      throw new AppError("service_offerings.not_found", "Servico nao encontrado.", 404);
    }

    if (data.isActive === true && !currentService.isActive) {
      await this.planEntitlementsService.assertCanCreateServiceOffering(user.organizationId);
    }

    const service = await this.servicesRepository.updateInOrganization(user.organizationId, id, {
      providerId: data.providerId,
      name: data.name,
      durationMinutes: data.durationMinutes,
      priceCents: data.priceCents ?? null,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });

    if (!service) {
      throw new AppError("service_offerings.not_found", "Servico nao encontrado.", 404);
    }

    return service;
  }

  public async setStatus(user: AuthenticatedRequestUser, id: string, isActive: boolean): Promise<ServiceOffering> {
    if (isActive) {
      const currentService = await this.servicesRepository.findByIdInOrganization(user.organizationId, id);
      if (currentService && !currentService.isActive) {
        await this.planEntitlementsService.assertCanCreateServiceOffering(user.organizationId);
      }
    }

    const service = await this.servicesRepository.setActiveInOrganization(user.organizationId, id, isActive);

    if (!service) {
      throw new AppError("service_offerings.not_found", "Servico nao encontrado.", 404);
    }

    return service;
  }

  private async ensureProvider(user: AuthenticatedRequestUser, providerId: string): Promise<void> {
    const provider = await this.providersRepository.findByIdInOrganization(user.organizationId, providerId);

    if (!provider) {
      throw new AppError("providers.not_found", "Prestador nao encontrado.", 404);
    }
  }
}
