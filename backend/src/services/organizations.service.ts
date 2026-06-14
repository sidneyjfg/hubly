import { z } from "zod";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { OrganizationsRepository } from "../repositories/organizations.repository";
import {
  isStorefrontBookingAutomationReady,
  OrganizationNotificationSettingsRepository,
} from "../repositories/organization-notification-settings.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type {
  Organization,
  OrganizationStorefrontInput,
  OrganizationWriteInput,
  StorefrontImageDeleteInput,
  StorefrontImageUploadInput,
  StorefrontImageUploadResult,
} from "../types/organization";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";
import { slugify } from "../utils/slug";
import { defaultTimeZone } from "../utils/timezone";
import { PlanEntitlementsService } from "./plan-entitlements.service";

const organizationWriteSchema = z.object({
  legalName: z.string().min(3).max(160),
  tradeName: z.string().min(3).max(160),
  bookingPageSlug: z.string().min(3).max(160).optional(),
  timezone: z.string().min(3).max(60).optional().default(defaultTimeZone),
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

const storefrontImageUploadSchema = z.object({
  slot: z.enum(["cover", "logo", "gallery"]),
  fileName: z.string().trim().max(180).optional(),
  contentType: z.string().trim().max(80).optional(),
  data: z.string().min(1),
});

const storefrontImageDeleteSchema = z.object({
  url: z.string().trim().min(1).max(800),
});

type DecodedImage = {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

const maxStorefrontImageBytes = 5 * 1024 * 1024;
const storefrontUploadsRoot = path.resolve(process.env.STOREFRONT_UPLOAD_DIR ?? path.join(process.cwd(), "uploads", "storefront"));

const contentTypeToExtension: Record<DecodedImage["contentType"], DecodedImage["extension"]> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const detectImageContentType = (buffer: Buffer): DecodedImage["contentType"] | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }

  return null;
};

export const getStorefrontAssetPath = (organizationId: string, fileName: string): string | null => {
  const safeFileName = path.basename(fileName);

  if (!safeFileName || safeFileName !== fileName || !/^[a-f0-9-]+\.(jpg|png|webp)$/.test(safeFileName)) {
    return null;
  }

  const assetPath = path.resolve(storefrontUploadsRoot, organizationId, safeFileName);
  const organizationRoot = path.resolve(storefrontUploadsRoot, organizationId);

  return assetPath.startsWith(`${organizationRoot}${path.sep}`) ? assetPath : null;
};

const parseImageData = (data: string, providedContentType?: string): DecodedImage => {
  const dataUrlMatch = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(data.trim());
  const declaredContentType = dataUrlMatch?.[1]?.toLowerCase() ?? providedContentType?.toLowerCase();
  const rawBase64 = dataUrlMatch?.[2] ?? data;
  const buffer = Buffer.from(rawBase64, "base64");

  if (buffer.length === 0 || buffer.length > maxStorefrontImageBytes) {
    throw new AppError("storefront.image_size_invalid", "Storefront image must be between 1 byte and 5 MB.", 400);
  }

  const detectedContentType = detectImageContentType(buffer);

  if (!detectedContentType || (declaredContentType && declaredContentType !== detectedContentType)) {
    throw new AppError("storefront.image_type_invalid", "Storefront image must be JPEG, PNG or WebP.", 400);
  }

  return {
    buffer,
    contentType: detectedContentType,
    extension: contentTypeToExtension[detectedContentType],
  };
};

const buildPublicAssetUrl = (organizationId: string, fileName: string): string =>
  `${env.PUBLIC_API_BASE_URL.replace(/\/$/, "")}/v1/public/assets/storefront/${organizationId}/${fileName}`;

const extractStorefrontAssetFileName = (organizationId: string, imageUrl: string): string | null => {
  try {
    const parsedUrl = new URL(imageUrl);
    const pathPrefix = `/v1/public/assets/storefront/${organizationId}/`;

    if (!parsedUrl.pathname.startsWith(pathPrefix)) {
      return null;
    }

    return decodeURIComponent(parsedUrl.pathname.slice(pathPrefix.length));
  } catch {
    const pathPrefix = `/v1/public/assets/storefront/${organizationId}/`;

    if (!imageUrl.startsWith(pathPrefix)) {
      return null;
    }

    return decodeURIComponent(imageUrl.slice(pathPrefix.length));
  }
};

export class OrganizationsService {
  public constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly organizationNotificationSettingsRepository: OrganizationNotificationSettingsRepository,
    private readonly planEntitlementsService: PlanEntitlementsService,
  ) {}

  public async list(user: AuthenticatedRequestUser, paginationInput: PaginationInput = {}): Promise<PaginatedResult<Organization>> {
    return this.organizationsRepository.findAll(parsePagination(paginationInput), user.organizationId);
  }

  public async create(input: OrganizationWriteInput): Promise<Organization> {
    const data = organizationWriteSchema.parse(input);
    return this.organizationsRepository.create({
      ...data,
      timezone: defaultTimeZone,
      bookingPageSlug: slugify(data.bookingPageSlug ?? data.tradeName),
    });
  }

  public async update(user: AuthenticatedRequestUser, id: string, input: OrganizationWriteInput): Promise<Organization> {
    const data = organizationWriteSchema.parse(input);
    const organization = await this.organizationsRepository.updateInOrganization(user.organizationId, id, {
      ...data,
      timezone: defaultTimeZone,
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
    await this.planEntitlementsService.assertCanUseGallerySize(user.organizationId, data.galleryImageUrls?.length ?? 0);
    if (data.isStorefrontPublished) {
      await this.assertStorefrontBookingAutomationReady(user.organizationId);
    }

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

  private async assertStorefrontBookingAutomationReady(organizationId: string): Promise<void> {
    const settings = await this.organizationNotificationSettingsRepository.findBookingEventsByOrganization(organizationId);

    if (!isStorefrontBookingAutomationReady(settings)) {
      throw new AppError(
        "storefront.automation_required",
        "Booking event automations must be enabled before publishing the storefront.",
        409,
      );
    }
  }

  public async uploadStorefrontImage(
    user: AuthenticatedRequestUser,
    input: StorefrontImageUploadInput,
  ): Promise<StorefrontImageUploadResult> {
    const data = storefrontImageUploadSchema.parse(input);
    const image = parseImageData(data.data, data.contentType);
    const directory = path.resolve(storefrontUploadsRoot, user.organizationId);
    const fileName = `${randomUUID()}.${image.extension}`;
    const filePath = getStorefrontAssetPath(user.organizationId, fileName);

    if (!filePath) {
      throw new AppError("storefront.image_path_invalid", "Invalid storefront image path.", 400);
    }

    await mkdir(directory, { recursive: true });
    await writeFile(filePath, image.buffer, { flag: "wx" });

    return {
      url: buildPublicAssetUrl(user.organizationId, fileName),
      contentType: image.contentType,
      sizeBytes: image.buffer.length,
    };
  }

  public async deleteStorefrontImage(user: AuthenticatedRequestUser, input: StorefrontImageDeleteInput): Promise<void> {
    const data = storefrontImageDeleteSchema.parse(input);
    const fileName = extractStorefrontAssetFileName(user.organizationId, data.url);

    if (!fileName) {
      return;
    }

    const filePath = getStorefrontAssetPath(user.organizationId, fileName);

    if (!filePath) {
      return;
    }

    await unlink(filePath).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        return;
      }

      throw error;
    });
  }

  public async storefrontAssetExists(organizationId: string, fileName: string): Promise<string | null> {
    const filePath = getStorefrontAssetPath(organizationId, fileName);

    if (!filePath) {
      return null;
    }

    const assetStats = await stat(filePath).catch(() => null);

    return assetStats?.isFile() ? filePath : null;
  }
}
