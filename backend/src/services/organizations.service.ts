import { z } from "zod";

import { OrganizationsRepository } from "../repositories/organizations.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Organization, OrganizationWriteInput } from "../types/organization";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";
import { slugify } from "../utils/slug";

const organizationWriteSchema = z.object({
  legalName: z.string().min(3).max(160),
  tradeName: z.string().min(3).max(160),
  bookingPageSlug: z.string().min(3).max(160).optional(),
  timezone: z.string().min(3).max(60),
});

export class OrganizationsService {
  public constructor(private readonly organizationsRepository: OrganizationsRepository) {}

  public async list(user: AuthenticatedRequestUser, paginationInput: PaginationInput = {}): Promise<PaginatedResult<Organization>> {
    return this.organizationsRepository.findAll(parsePagination(paginationInput), user.organizationId);
  }

  public async create(input: OrganizationWriteInput): Promise<Organization> {
    const data = organizationWriteSchema.parse(input);
    return this.organizationsRepository.create({
      ...data,
      bookingPageSlug: slugify(data.bookingPageSlug ?? data.tradeName),
    });
  }

  public async update(user: AuthenticatedRequestUser, id: string, input: OrganizationWriteInput): Promise<Organization> {
    const data = organizationWriteSchema.parse(input);
    const organization = await this.organizationsRepository.updateInOrganization(user.organizationId, id, {
      ...data,
      bookingPageSlug: slugify(data.bookingPageSlug ?? data.tradeName),
    });

    if (!organization) {
      throw new AppError("organizations.not_found", "Organization not found.", 404);
    }

    return organization;
  }
}
