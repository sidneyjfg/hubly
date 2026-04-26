import { z } from "zod";

import { ProviderAvailabilitiesRepository } from "../repositories/provider-availabilities.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Provider, ProviderAvailability, ProviderAvailabilityWriteInput, ProviderWriteInput } from "../types/provider";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";

const providerWriteSchema = z.object({
  fullName: z.string().min(3).max(120),
  specialty: z.string().min(2).max(120),
  isActive: z.boolean().optional(),
});

const providerAvailabilityWriteSchema = z.array(z.object({
  weekday: z.number().int().min(0).max(6),
  workStart: z.string().regex(/^\d{2}:\d{2}$/),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/),
  lunchStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  lunchEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  isActive: z.boolean().optional(),
})).superRefine((items, ctx) => {
  const weekdays = new Set<number>();

  for (const item of items) {
    if (weekdays.has(item.weekday)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Duplicated weekday.", path: [String(item.weekday)] });
    }

    weekdays.add(item.weekday);
  }
});

export class ProvidersService {
  public constructor(
    private readonly providersRepository: ProvidersRepository,
    private readonly providerAvailabilitiesRepository: ProviderAvailabilitiesRepository,
  ) {}

  public async list(
    user: AuthenticatedRequestUser,
    paginationInput: PaginationInput = {},
  ): Promise<PaginatedResult<Provider>> {
    return this.providersRepository.findAll(user.organizationId, parsePagination(paginationInput));
  }

  public async create(user: AuthenticatedRequestUser, input: ProviderWriteInput): Promise<Provider> {
    const data = providerWriteSchema.parse(input);
    return this.providersRepository.create(user.organizationId, {
      fullName: data.fullName,
      specialty: data.specialty,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });
  }

  public async update(user: AuthenticatedRequestUser, id: string, input: ProviderWriteInput): Promise<Provider> {
    const data = providerWriteSchema.parse(input);
    const provider = await this.providersRepository.updateInOrganization(user.organizationId, id, {
      fullName: data.fullName,
      specialty: data.specialty,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    });

    if (!provider) {
      throw new AppError("providers.not_found", "Provider not found.", 404);
    }

    return provider;
  }

  public async setStatus(user: AuthenticatedRequestUser, id: string, isActive: boolean): Promise<Provider> {
    const provider = await this.providersRepository.setActiveInOrganization(user.organizationId, id, isActive);

    if (!provider) {
      throw new AppError("providers.not_found", "Provider not found.", 404);
    }

    return provider;
  }

  public async listAvailability(user: AuthenticatedRequestUser, providerId: string): Promise<ProviderAvailability[]> {
    await this.ensureProvider(user, providerId);
    return this.providerAvailabilitiesRepository.findByProviderInOrganization(user.organizationId, providerId);
  }

  public async replaceAvailability(
    user: AuthenticatedRequestUser,
    providerId: string,
    input: ProviderAvailabilityWriteInput[],
  ): Promise<ProviderAvailability[]> {
    await this.ensureProvider(user, providerId);
    const data = providerAvailabilityWriteSchema.parse(input);
    const normalizedData = data.map((item) => ({
      weekday: item.weekday,
      workStart: item.workStart,
      workEnd: item.workEnd,
      ...(item.lunchStart === undefined ? {} : { lunchStart: item.lunchStart }),
      ...(item.lunchEnd === undefined ? {} : { lunchEnd: item.lunchEnd }),
      ...(item.isActive === undefined ? {} : { isActive: item.isActive }),
    }));

    return this.providerAvailabilitiesRepository.replaceForProviderInOrganization(
      user.organizationId,
      providerId,
      normalizedData,
    );
  }

  private async ensureProvider(user: AuthenticatedRequestUser, providerId: string): Promise<void> {
    const provider = await this.providersRepository.findByIdInOrganization(user.organizationId, providerId);

    if (!provider) {
      throw new AppError("providers.not_found", "Provider not found.", 404);
    }
  }
}
