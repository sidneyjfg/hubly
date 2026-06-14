import type { FastifyReply, FastifyRequest } from "fastify";
import { createReadStream } from "node:fs";
import path from "node:path";

import { OrganizationsService } from "../services/organizations.service";
import { getAuthUser } from "../utils/request-auth";

export class OrganizationsController {
  public constructor(private readonly organizationsService: OrganizationsService) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { limit?: string; page?: string };
    reply.status(200).send(await this.organizationsService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      legalName?: string;
      tradeName?: string;
      bookingPageSlug?: string;
    };
    const input = {
      legalName: body.legalName ?? "",
      tradeName: body.tradeName ?? "",
      ...(body.bookingPageSlug === undefined ? {} : { bookingPageSlug: body.bookingPageSlug }),
    };

    reply.status(201).send(
      await this.organizationsService.create(input),
    );
  };

  public update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      legalName?: string;
      tradeName?: string;
      bookingPageSlug?: string;
    };
    const input = {
      legalName: body.legalName ?? "",
      tradeName: body.tradeName ?? "",
      ...(body.bookingPageSlug === undefined ? {} : { bookingPageSlug: body.bookingPageSlug }),
    };

    reply.status(200).send(
      await this.organizationsService.update(getAuthUser(request), params.id ?? "", input),
    );
  };

  public getStorefront = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.organizationsService.getStorefront(getAuthUser(request)));
  };

  public updateStorefront = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      tradeName?: string;
      bookingPageSlug?: string;
      publicDescription?: string | null;
      publicPhone?: string | null;
      publicEmail?: string | null;
      addressLine?: string | null;
      addressNumber?: string | null;
      district?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      coverImageUrl?: string | null;
      logoImageUrl?: string | null;
      galleryImageUrls?: string[];
      isStorefrontPublished?: boolean;
    };

    reply.status(200).send(
      await this.organizationsService.updateStorefront(getAuthUser(request), {
        tradeName: body.tradeName ?? "",
        ...(body.bookingPageSlug === undefined ? {} : { bookingPageSlug: body.bookingPageSlug }),
        publicDescription: body.publicDescription ?? null,
        publicPhone: body.publicPhone ?? null,
        publicEmail: body.publicEmail ?? null,
        addressLine: body.addressLine ?? null,
        addressNumber: body.addressNumber ?? null,
        district: body.district ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        postalCode: body.postalCode ?? null,
        coverImageUrl: body.coverImageUrl ?? null,
        logoImageUrl: body.logoImageUrl ?? null,
        galleryImageUrls: body.galleryImageUrls ?? [],
        isStorefrontPublished: body.isStorefrontPublished ?? false,
      }),
    );
  };

  public uploadStorefrontImage = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      slot?: "cover" | "logo" | "gallery";
      fileName?: string;
      contentType?: string;
      data?: string;
    };

    reply.status(201).send(
      await this.organizationsService.uploadStorefrontImage(getAuthUser(request), {
        slot: body.slot ?? "gallery",
        ...(body.fileName === undefined ? {} : { fileName: body.fileName }),
        ...(body.contentType === undefined ? {} : { contentType: body.contentType }),
        data: body.data ?? "",
      }),
    );
  };

  public deleteStorefrontImage = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as { url?: string };

    await this.organizationsService.deleteStorefrontImage(getAuthUser(request), {
      url: body.url ?? "",
    });

    reply.status(204).send();
  };

  public getStorefrontImage = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { organizationId?: string; fileName?: string };
    const organizationId = params.organizationId ?? "";
    const fileName = params.fileName ?? "";
    const filePath = await this.organizationsService.storefrontAssetExists(organizationId, fileName);

    if (!filePath) {
      reply.status(404).send({ message: "Image not found." });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";

    reply.header("cache-control", "public, max-age=31536000, immutable");
    reply.type(contentType).send(createReadStream(filePath));
  };
}
