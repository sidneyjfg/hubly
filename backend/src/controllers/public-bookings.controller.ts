import type { FastifyReply, FastifyRequest } from "fastify";

import { PublicBookingsService } from "../services/public-bookings.service";

export class PublicBookingsController {
  public constructor(private readonly publicBookingsService: PublicBookingsService) {}

  public getBookingPage = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { slug?: string };
    reply.status(200).send(await this.publicBookingsService.getBookingPage(params.slug ?? ""));
  };

  public listBookingPages = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.publicBookingsService.listPublishedBookingPages());
  };

  public getAvailability = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { slug?: string };
    const query = request.query as { providerId?: string; date?: string; offeringId?: string | null };

    reply.status(200).send(await this.publicBookingsService.getAvailableSlots(params.slug ?? "", {
      providerId: query.providerId ?? "",
      date: query.date ?? "",
      offeringId: query.offeringId ?? null,
    }));
  };

  public createBooking = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { slug?: string };
    const body = request.body as {
      fullName?: string;
      email?: string | null;
      phone?: string;
      password?: string;
      providerId?: string;
      offeringId?: string | null;
      startsAt?: string;
      endsAt?: string;
      notes?: string | null;
      paymentType?: "online" | "presential";
    };

    reply.status(201).send(await this.publicBookingsService.createBooking(params.slug ?? "", {
      fullName: body.fullName ?? "",
      email: body.email ?? null,
      phone: body.phone ?? "",
      password: body.password ?? "",
      providerId: body.providerId ?? "",
      offeringId: body.offeringId ?? null,
      startsAt: body.startsAt ?? "",
      endsAt: body.endsAt ?? "",
      notes: body.notes ?? null,
      paymentType: body.paymentType ?? "presential",
    }));
  };
}
