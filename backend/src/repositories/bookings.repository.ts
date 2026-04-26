import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager, Not } from "typeorm";

import { BookingEntity } from "../database/entities";
import type { Booking, BookingPaymentStatus, BookingPaymentType, BookingStatus, NoShowOverview } from "../types/booking";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class BookingsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(BookingEntity);
  }

  private mapBooking(booking: BookingEntity): Booking {
    return {
      id: booking.id,
      organizationId: booking.organizationId,
      customerId: booking.customerId,
      providerId: booking.providerId,
      offeringId: booking.offeringId,
      createdByUserId: booking.createdByUserId,
      customerName: booking.customer?.fullName,
      providerName: booking.provider?.fullName,
      serviceName: booking.offering?.name ?? null,
      status: booking.status as Booking["status"],
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      notes: booking.notes,
      paymentType: booking.paymentType as BookingPaymentType,
      originalAmountCents: booking.originalAmountCents,
      discountedAmountCents: booking.discountedAmountCents,
      onlineDiscountCents: booking.onlineDiscountCents,
      platformCommissionRateBps: booking.platformCommissionRateBps,
      platformCommissionCents: booking.platformCommissionCents,
      providerNetAmountCents: booking.providerNetAmountCents,
      paymentStatus: booking.paymentStatus as BookingPaymentStatus,
      paymentCheckoutUrl: booking.paymentCheckoutUrl,
    };
  }

  public async findAll(
    organizationId: string,
    filters: {
      from?: Date;
      to?: Date;
      pagination?: Pagination;
    } = {},
  ): Promise<PaginatedResult<Booking>> {
    const query = this.getRepository().createQueryBuilder("booking")
      .leftJoinAndSelect("booking.customer", "customer")
      .leftJoinAndSelect("booking.provider", "provider")
      .leftJoinAndSelect("booking.offering", "offering")
      .where("booking.organizationId = :organizationId", { organizationId });

    if (filters.from) {
      query.andWhere("booking.startsAt >= :from", { from: filters.from });
    }

    if (filters.to) {
      query.andWhere("booking.startsAt < :to", { to: filters.to });
    }

    const pagination = filters.pagination ?? { page: 1, limit: 100 };
    const [bookings, total] = await query
      .orderBy("booking.startsAt", "ASC")
      .skip(getPaginationOffset(pagination))
      .take(pagination.limit)
      .getManyAndCount();

    return buildPaginatedResult(bookings.map((booking) => this.mapBooking(booking)), total, pagination);
  }

  public async findUpcomingActiveByOrganization(
    organizationId: string,
    from: Date,
    manager?: EntityManager,
  ): Promise<Booking[]> {
    const bookings = await this.getRepository(manager).createQueryBuilder("booking")
      .leftJoinAndSelect("booking.customer", "customer")
      .leftJoinAndSelect("booking.provider", "provider")
      .where("booking.organizationId = :organizationId", { organizationId })
      .andWhere("booking.startsAt > :from", { from })
      .andWhere("booking.status IN (:...statuses)", {
        statuses: ["scheduled", "confirmed", "rescheduled"],
      })
      .orderBy("booking.startsAt", "ASC")
      .getMany();

    return bookings.map((booking) => this.mapBooking(booking));
  }

  public async findByIdInOrganization(
    organizationId: string,
    id: string,
    manager?: EntityManager,
  ): Promise<Booking | null> {
    const booking = await this.getRepository(manager).findOne({
      where: {
        id,
        organizationId,
      },
      relations: {
        customer: true,
        provider: true,
        offering: true,
      },
    });

    return booking ? this.mapBooking(booking) : null;
  }

  public async create(
    input: {
      organizationId: string;
      customerId: string;
      providerId: string;
      offeringId?: string | null;
      createdByUserId?: string | null;
      status: BookingStatus;
      startsAt: Date;
      endsAt: Date;
      notes?: string | null;
      paymentType?: BookingPaymentType;
      originalAmountCents?: number;
      discountedAmountCents?: number;
      onlineDiscountCents?: number;
      platformCommissionRateBps?: number;
      platformCommissionCents?: number;
      providerNetAmountCents?: number;
      paymentStatus?: BookingPaymentStatus;
      paymentCheckoutUrl?: string | null;
    },
    manager: EntityManager,
  ): Promise<Booking> {
    const booking = await this.getRepository(manager).save({
      id: randomUUID(),
      organizationId: input.organizationId,
      customerId: input.customerId,
      providerId: input.providerId,
      offeringId: input.offeringId ?? null,
      createdByUserId: input.createdByUserId ?? null,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      notes: input.notes ?? null,
      paymentType: input.paymentType ?? "presential",
      originalAmountCents: input.originalAmountCents ?? 0,
      discountedAmountCents: input.discountedAmountCents ?? input.originalAmountCents ?? 0,
      onlineDiscountCents: input.onlineDiscountCents ?? 0,
      platformCommissionRateBps: input.platformCommissionRateBps ?? 1000,
      platformCommissionCents: input.platformCommissionCents ?? 0,
      providerNetAmountCents: input.providerNetAmountCents ?? 0,
      paymentStatus: input.paymentStatus ?? "pending_local",
      paymentCheckoutUrl: input.paymentCheckoutUrl ?? null,
    });

    const savedBooking = await this.getRepository(manager).findOneOrFail({
      where: {
        id: booking.id,
        organizationId: input.organizationId,
      },
      relations: {
        customer: true,
        provider: true,
        offering: true,
      },
    });

    return this.mapBooking(savedBooking);
  }

  public async updateInOrganization(
    organizationId: string,
    id: string,
    input: {
      customerId?: string;
      providerId?: string;
      offeringId?: string | null;
      status?: BookingStatus;
      startsAt?: Date;
      endsAt?: Date;
      notes?: string | null;
      paymentType?: BookingPaymentType;
      originalAmountCents?: number;
      discountedAmountCents?: number;
      onlineDiscountCents?: number;
      platformCommissionRateBps?: number;
      platformCommissionCents?: number;
      providerNetAmountCents?: number;
      paymentStatus?: BookingPaymentStatus;
      paymentCheckoutUrl?: string | null;
    },
    manager: EntityManager,
  ): Promise<Booking | null> {
    const repository = this.getRepository(manager);
    const booking = await repository.findOne({
      where: {
        id,
        organizationId,
      },
      relations: {
        customer: true,
        provider: true,
      },
    });

    if (!booking) {
      return null;
    }

    booking.customerId = input.customerId ?? booking.customerId;
    booking.providerId = input.providerId ?? booking.providerId;
    booking.offeringId = input.offeringId === undefined ? booking.offeringId : input.offeringId;
    booking.status = input.status ?? booking.status;
    booking.startsAt = input.startsAt ?? booking.startsAt;
    booking.endsAt = input.endsAt ?? booking.endsAt;
    booking.notes = input.notes ?? booking.notes;
    booking.paymentType = input.paymentType ?? booking.paymentType;
    booking.originalAmountCents = input.originalAmountCents ?? booking.originalAmountCents;
    booking.discountedAmountCents = input.discountedAmountCents ?? booking.discountedAmountCents;
    booking.onlineDiscountCents = input.onlineDiscountCents ?? booking.onlineDiscountCents;
    booking.platformCommissionRateBps = input.platformCommissionRateBps ?? booking.platformCommissionRateBps;
    booking.platformCommissionCents = input.platformCommissionCents ?? booking.platformCommissionCents;
    booking.providerNetAmountCents = input.providerNetAmountCents ?? booking.providerNetAmountCents;
    booking.paymentStatus = input.paymentStatus ?? booking.paymentStatus;
    booking.paymentCheckoutUrl = input.paymentCheckoutUrl === undefined ? booking.paymentCheckoutUrl : input.paymentCheckoutUrl;

    await repository.save(booking);

    const savedBooking = await repository.findOneOrFail({
      where: {
        id,
        organizationId,
      },
      relations: {
        customer: true,
        provider: true,
        offering: true,
      },
    });

    return this.mapBooking(savedBooking);
  }

  public async hasConflict(
    organizationId: string,
    providerId: string,
    startsAt: Date,
    endsAt: Date,
    manager: EntityManager,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.getRepository(manager)
      .createQueryBuilder("booking")
      .where("booking.organizationId = :organizationId", { organizationId })
      .andWhere("booking.providerId = :providerId", { providerId })
      .andWhere("booking.status != :cancelledStatus", { cancelledStatus: "cancelled" })
      .andWhere("booking.startsAt < :endsAt", { endsAt })
      .andWhere("booking.endsAt > :startsAt", { startsAt });

    if (excludeId) {
      query.andWhere("booking.id != :excludeId", { excludeId });
    }

    const conflictCount = await query.getCount();
    return conflictCount > 0;
  }

  public async buildNoShowOverview(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<NoShowOverview> {
    const bookings = await this.getRepository().find({
      where: {
        organizationId,
      },
    });

    const periodItems = bookings.filter((booking) => {
      const startsAtTime = booking.startsAt.getTime();
      return startsAtTime >= periodStart.getTime() && startsAtTime < periodEnd.getTime();
    });

    const attendedBookings = periodItems.filter((booking) => booking.status === "attended").length;
    const missedBookings = periodItems.filter((booking) => booking.status === "missed").length;
    const totalBookings = attendedBookings + missedBookings;

    return {
      organizationId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalBookings,
      attendedBookings,
      missedBookings,
      noShowRate: totalBookings === 0 ? 0 : Number((missedBookings / totalBookings).toFixed(4)),
    };
  }
}
