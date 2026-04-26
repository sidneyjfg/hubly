import { z } from "zod";

import { OrganizationsRepository } from "../repositories/organizations.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Organization, OrganizationStorefrontInput, OrganizationWriteInput } from "../types/organization";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";
import { slugify } from "../utils/slug";

const organizationWriteSchema = z.object({
  legalName: z.string().min(3).max(160),
  tradeName: z.string().min(3).max(160),
  bookingPageSlug: z.string().min(3).max(160).optional(),
  timezone: z.string().min(3).max(60),
});

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

const organizationStorefrontSchema = z.object({
  tradeName: z.string().trim().min(3).max(160),
  bookingPageSlug: z.string().trim().min(3).max(160).optional(),
  publicDescription: nullableText(500),
  publicPhone: nullableText(30),
  publicEmail: z.string().trim().email().nullable().optional(),
  addressLine: nullableText(180),
  addressNumber: nullableText(20),
  district: nullableText(120),
  city: nullableText(120),
  state: nullableText(2),
  postalCode: nullableText(12),
  coverImageUrl: nullableText(500),
  logoImageUrl: nullableText(500),
  galleryImageUrls: z.array(z.string().trim().url().max(500)).max(12).optional(),
  isStorefrontPublished: z.boolean().optional(),
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

  public async getStorefront(user: AuthenticatedRequestUser): Promise<Organization> {
    const organization = await this.organizationsRepository.findByIdInOrganization(user.organizationId, user.organizationId);

    if (!organization) {
      throw new AppError("organizations.not_found", "Organization not found.", 404);
    }

    return organization;
  }

  public async updateStorefront(user: AuthenticatedRequestUser, input: OrganizationStorefrontInput): Promise<Organization> {
    const data = organizationStorefrontSchema.parse(input);
    const organization = await this.organizationsRepository.updateStorefrontInOrganization(user.organizationId, {
      ...data,
      bookingPageSlug: slugify(data.bookingPageSlug ?? data.tradeName),
      publicDescription: data.publicDescription ?? null,
      publicPhone: data.publicPhone ?? null,
      publicEmail: data.publicEmail ?? null,
      addressLine: data.addressLine ?? null,
      addressNumber: data.addressNumber ?? null,
      district: data.district ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      postalCode: data.postalCode ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      logoImageUrl: data.logoImageUrl ?? null,
      galleryImageUrls: data.galleryImageUrls ?? [],
      isStorefrontPublished: data.isStorefrontPublished ?? false,
    });

    if (!organization) {
      throw new AppError("organizations.not_found", "Organization not found.", 404);
    }

    return organization;
  }
}
