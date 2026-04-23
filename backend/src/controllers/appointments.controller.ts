import type { FastifyReply, FastifyRequest } from "fastify";

import { AppointmentsService } from "../services/appointments.service";
import { getAuthUser } from "../utils/request-auth";

export class AppointmentsController {
  public constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  public list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as {
      from?: string;
      limit?: string;
      page?: string;
      to?: string;
    };

    reply.status(200).send(await this.appointmentsService.list(getAuthUser(request), query));
  };

  public create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = request.body as {
      patientId?: string;
      professionalId?: string;
      serviceId?: string | null;
      startsAt?: string;
      endsAt?: string;
      notes?: string | null;
    };

    reply.status(201).send(
      await this.appointmentsService.create(getAuthUser(request), {
        patientId: body.patientId ?? "",
        professionalId: body.professionalId ?? "",
        serviceId: body.serviceId ?? null,
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
      await this.appointmentsService.cancel(getAuthUser(request), params.id ?? "", {
        notes: body.notes ?? null,
      }),
    );
  };

  public reschedule = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as {
      patientId?: string;
      professionalId?: string;
      serviceId?: string | null;
      startsAt?: string;
      endsAt?: string;
      notes?: string | null;
    };

    reply.status(200).send(
      await this.appointmentsService.reschedule(getAuthUser(request), params.id ?? "", {
        patientId: body.patientId ?? "",
        professionalId: body.professionalId ?? "",
        serviceId: body.serviceId ?? null,
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
      await this.appointmentsService.markAttended(getAuthUser(request), params.id ?? "", {
        notes: body.notes ?? null,
      }),
    );
  };

  public markMissed = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { id?: string };
    const body = request.body as { notes?: string | null };

    reply.status(200).send(
      await this.appointmentsService.markMissed(getAuthUser(request), params.id ?? "", {
        notes: body.notes ?? null,
      }),
    );
  };

  public dailySchedule = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { date?: string; limit?: string; page?: string };
    reply.status(200).send(await this.appointmentsService.getDailySchedule(getAuthUser(request), query));
  };

  public weeklySchedule = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = request.query as { date?: string; limit?: string; page?: string };
    reply.status(200).send(await this.appointmentsService.getWeeklySchedule(getAuthUser(request), query));
  };
}
