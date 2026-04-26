import type { FastifyReply, FastifyRequest } from "fastify";

import { BookingsService } from "../services/bookings.service";
import { getAuthUser } from "../utils/request-auth";

export class BookingsController {
  public constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as {
      from?: string;
      limit?: string;
      page?: string;
      to?: string;
    };

    reply.status(200).send(await this.bookingsService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      customerId?: string;
      providerId?: string;
      offeringId?: string | null;
      startsAt?: string;
      endsAt?: string;
      notes?: string | null;
    };

    reply.status(201).send(
      await this.bookingsService.create(getAuthUser(request), {
        customerId: body.customerId ?? "",
        providerId: body.providerId ?? "",
        offeringId: body.offeringId ?? null,
        startsAt: body.startsAt ?? "",
        endsAt: body.endsAt ?? "",
        notes: body.notes ?? null,
      }),
    );
  };

  public cancel = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { notes?: string | null };

    reply.status(200).send(
      await this.bookingsService.cancel(getAuthUser(request), params.id ?? "", {
        notes: body.notes ?? null,
      }),
    );
  };

  public reschedule = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      customerId?: string;
      providerId?: string;
      offeringId?: string | null;
      startsAt?: string;
      endsAt?: string;
      notes?: string | null;
    };

    reply.status(200).send(
      await this.bookingsService.reschedule(getAuthUser(request), params.id ?? "", {
        customerId: body.customerId ?? "",
        providerId: body.providerId ?? "",
        offeringId: body.offeringId ?? null,
        startsAt: body.startsAt ?? "",
        endsAt: body.endsAt ?? "",
        notes: body.notes ?? null,
      }),
    );
  };

  public markAttended = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { notes?: string | null };

    reply.status(200).send(
      await this.bookingsService.markAttended(getAuthUser(request), params.id ?? "", {
        notes: body.notes ?? null,
      }),
    );
  };

  public markMissed = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { notes?: string | null };

    reply.status(200).send(
      await this.bookingsService.markMissed(getAuthUser(request), params.id ?? "", {
        notes: body.notes ?? null,
      }),
    );
  };

  public dailySchedule = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { date?: string; limit?: string; page?: string };
    reply.status(200).send(await this.bookingsService.getDailySchedule(getAuthUser(request), query));
  };

  public weeklySchedule = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { date?: string; limit?: string; page?: string };
    reply.status(200).send(await this.bookingsService.getWeeklySchedule(getAuthUser(request), query));
  };
}
