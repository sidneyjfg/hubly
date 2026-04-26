import type { DataSource, EntityManager } from "typeorm";
import { randomUUID } from "node:crypto";

import { OrganizationEntity } from "../database/entities";
import type { Organization, OrganizationStorefrontInput, OrganizationWriteInput } from "../types/organization";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class OrganizationsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(OrganizationEntity);
  }

  private mapOrganization(organization: OrganizationEntity): Organization {
    return {
      id: organization.id,
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      bookingPageSlug: organization.bookingPageSlug,
      timezone: organization.timezone,
      publicDescription: organization.publicDescription,
      publicPhone: organization.publicPhone,
      publicEmail: organization.publicEmail,
      addressLine: organization.addressLine,
      addressNumber: organization.addressNumber,
      district: organization.district,
      city: organization.city,
      state: organization.state,
      postalCode: organization.postalCode,
      coverImageUrl: organization.coverImageUrl,
      logoImageUrl: organization.logoImageUrl,
      galleryImageUrls: organization.galleryImageUrls ?? [],
      isStorefrontPublished: organization.isStorefrontPublished,
    };
  }

  public async findAll(pagination: Pagination, organizationId?: string): Promise<PaginatedResult<Organization>> {
    const [organizations, total] = organizationId
      ? await this.getRepository().findAndCount({
          where: { id: organizationId },
          order: {
            tradeName: "ASC",
          },
          skip: getPaginationOffset(pagination),
          take: pagination.limit,
        })
      : await this.getRepository().findAndCount({
          order: {
            tradeName: "ASC",
          },
          skip: getPaginationOffset(pagination),
          take: pagination.limit,
        });

    return buildPaginatedResult(organizations.map((organization) => this.mapOrganization(organization)), total, pagination);
  }

  public async findPublishedStorefronts(pagination: Pagination): Promise<PaginatedResult<Organization>> {
    const [organizations, total] = await this.getRepository().findAndCount({
      where: {
        isStorefrontPublished: true,
      },
      order: {
        tradeName: "ASC",
      },
      skip: getPaginationOffset(pagination),
      take: pagination.limit,
    });

    return buildPaginatedResult(organizations.map((organization) => this.mapOrganization(organization)), total, pagination);
  }

  public async findByIdInOrganization(organizationId: string, id: string, manager?: EntityManager): Promise<Organization | null> {
    const organization = await this.getRepository(manager).findOne({
      where: {
        id,
      },
    });

    if (!organization || organization.id !== organizationId) {
      return null;
    }

    return this.mapOrganization(organization);
  }

  public async create(input: OrganizationWriteInput, manager?: EntityManager): Promise<Organization> {
    const organization = await this.getRepository(manager).save({
      id: randomUUID(),
      legalName: input.legalName,
      tradeName: input.tradeName,
      bookingPageSlug: input.bookingPageSlug ?? randomUUID(),
      timezone: input.timezone,
    });

    return this.mapOrganization(organization);
  }

  public async updateInOrganization(organizationId: string, id: string, input: OrganizationWriteInput): Promise<Organization | null> {
    const repository = this.getRepository();
    const organization = await repository.findOne({
      where: {
        id,
      },
    });

    if (!organization || organization.id !== organizationId) {
      return null;
    }

    organization.legalName = input.legalName;
    organization.tradeName = input.tradeName;
    organization.bookingPageSlug = input.bookingPageSlug ?? organization.bookingPageSlug;
    organization.timezone = input.timezone;

    const savedOrganization = await repository.save(organization);

    return this.mapOrganization(savedOrganization);
  }

  public async updateStorefrontInOrganization(
    organizationId: string,
    input: OrganizationStorefrontInput,
  ): Promise<Organization | null> {
    const repository = this.getRepository();
    const organization = await repository.findOne({
      where: {
        id: organizationId,
      },
    });

    if (!organization) {
      return null;
    }

    organization.tradeName = input.tradeName;
    organization.bookingPageSlug = input.bookingPageSlug ?? organization.bookingPageSlug;
    organization.publicDescription = input.publicDescription ?? null;
    organization.publicPhone = input.publicPhone ?? null;
    organization.publicEmail = input.publicEmail ?? null;
    organization.addressLine = input.addressLine ?? null;
    organization.addressNumber = input.addressNumber ?? null;
    organization.district = input.district ?? null;
    organization.city = input.city ?? null;
    organization.state = input.state ?? null;
    organization.postalCode = input.postalCode ?? null;
    organization.coverImageUrl = input.coverImageUrl ?? null;
    organization.logoImageUrl = input.logoImageUrl ?? null;
    organization.galleryImageUrls = input.galleryImageUrls ?? [];
    organization.isStorefrontPublished = input.isStorefrontPublished ?? false;

    return this.mapOrganization(await repository.save(organization));
  }

  public async findByBookingPageSlug(slug: string, manager?: EntityManager): Promise<Organization | null> {
    const organization = await this.getRepository(manager).findOne({
      where: {
        bookingPageSlug: slug,
      },
    });

    return organization ? this.mapOrganization(organization) : null;
  }
}
