import type { DataSource, EntityManager } from "typeorm";
import { z } from "zod";

import { AuditRepository } from "../repositories/audit.repository";
import { BookingsRepository } from "../repositories/bookings.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import { OrganizationIntegrationsRepository } from "../repositories/organization-integrations.repository";
import { OrganizationNotificationSettingsRepository } from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { ProviderAvailabilitiesRepository } from "../repositories/provider-availabilities.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import type { Booking, BookingAvailabilityQuery } from "../types/booking";
import type { PublicAvailableSlot, PublicBookingPage, PublicBookingRequestInput } from "../types/provider";
import { AppError } from "../utils/app-error";
import { buildAvailableSlots, isWithinProviderAvailability, resolveWeekday } from "../utils/provider-availability";
import { EvolutionWhatsAppService } from "./evolution-whatsapp.service";
import { NotificationsService } from "./notifications.service";
import { PaymentsService } from "./payments.service";
import type { PaymentBreakdown } from "../types/payment";

const publicBookingRequestSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(10).max(30),
  providerId: z.string().min(3),
  offeringId: z.string().min(3).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().max(255).nullable().optional(),
  paymentType: z.enum(["online", "presential"]).default("presential"),
});

const availabilityQuerySchema = z.object({
  providerId: z.string().min(3),
  date: z.string().date(),
  offeringId: z.string().min(3).nullable().optional(),
});

export class PublicBookingsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly providersRepository: ProvidersRepository,
    private readonly serviceOfferingsRepository: ServiceOfferingsRepository,
    private readonly providerAvailabilitiesRepository: ProviderAvailabilitiesRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly auditRepository: AuditRepository,
    private readonly paymentsService?: PaymentsService,
  ) {}

  public async getBookingPage(slug: string): Promise<PublicBookingPage> {
    const organization = await this.organizationsRepository.findByBookingPageSlug(slug);
    if (!organization) {
      throw new AppError("public_booking.organization_not_found", "Organization not found.", 404);
    }

    const [providers, serviceOfferings] = await Promise.all([
      this.providersRepository.findActiveByOrganization(organization.id),
      this.serviceOfferingsRepository.findActiveByOrganization(organization.id),
    ]);

    return {
      organizationId: organization.id,
      bookingPageSlug: organization.bookingPageSlug,
      tradeName: organization.tradeName,
      timezone: organization.timezone,
      publicDescription: organization.publicDescription ?? null,
      publicPhone: organization.publicPhone ?? null,
      publicEmail: organization.publicEmail ?? null,
      addressLine: organization.addressLine ?? null,
      addressNumber: organization.addressNumber ?? null,
      district: organization.district ?? null,
      city: organization.city ?? null,
      state: organization.state ?? null,
      postalCode: organization.postalCode ?? null,
      coverImageUrl: organization.coverImageUrl ?? null,
      logoImageUrl: organization.logoImageUrl ?? null,
      galleryImageUrls: organization.galleryImageUrls,
      isStorefrontPublished: organization.isStorefrontPublished,
      providers,
      serviceOfferings,
    };
  }

  public async getAvailableSlots(slug: string, query: BookingAvailabilityQuery): Promise<{ items: PublicAvailableSlot[] }> {
    const organization = await this.organizationsRepository.findByBookingPageSlug(slug);
    if (!organization) {
      throw new AppError("public_booking.organization_not_found", "Organization not found.", 404);
    }

    const data = availabilityQuerySchema.parse(query);
    const provider = await this.providersRepository.findByIdInOrganization(organization.id, data.providerId);

    if (!provider || !provider.isActive) {
      throw new AppError("providers.not_found", "Provider not found.", 404);
    }

    const weekday = resolveWeekday(data.date);
    const availability = await this.providerAvailabilitiesRepository.findByProviderAndWeekdayInOrganization(
      organization.id,
      data.providerId,
      weekday,
    );

    if (!availability) {
      return { items: [] };
    }

    const durationMinutes = data.offeringId
      ? (await this.serviceOfferingsRepository.findByIdInOrganization(organization.id, data.offeringId))?.durationMinutes ?? 30
      : 30;

    const dayStart = new Date(`${data.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${data.date}T23:59:59.999Z`);
    const existingBookings = await this.bookingsRepository.findAll(organization.id, {
      from: dayStart,
      to: dayEnd,
      pagination: { page: 1, limit: 500 },
    });

    const busyWindows = existingBookings.items
      .filter((booking) => booking.providerId === data.providerId && booking.status !== "cancelled")
      .map((booking) => ({
        startsAt: new Date(booking.startsAt),
        endsAt: new Date(booking.endsAt),
      }));

    return {
      items: buildAvailableSlots(data.date, availability, durationMinutes, busyWindows),
    };
  }

  public async createBooking(slug: string, input: PublicBookingRequestInput): Promise<Booking> {
    const organization = await this.organizationsRepository.findByBookingPageSlug(slug);
    if (!organization) {
      throw new AppError("public_booking.organization_not_found", "Organization not found.", 404);
    }

    const data = publicBookingRequestSchema.parse({
      ...input,
      email: input.email ?? null,
      notes: input.notes ?? null,
      offeringId: input.offeringId ?? null,
      paymentType: input.paymentType ?? "presential",
    });

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new AppError("bookings.invalid_window", "Invalid booking window.", 400);
    }

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const provider = await this.providersRepository.findByIdInOrganization(organization.id, data.providerId, manager);
      if (!provider || !provider.isActive) {
        throw new AppError("providers.not_found", "Provider not found.", 404);
      }

      const weekday = startsAt.getUTCDay();
      const availability = await this.providerAvailabilitiesRepository.findByProviderAndWeekdayInOrganization(
        organization.id,
        data.providerId,
        weekday,
        manager,
      );

      if (!availability || !isWithinProviderAvailability(availability, startsAt, endsAt)) {
        throw new AppError("bookings.outside_provider_availability", "Booking is outside provider working hours.", 409);
      }

      let serviceName: string | null = null;
      if (data.offeringId) {
        const offering = await this.serviceOfferingsRepository.findByIdInOrganization(organization.id, data.offeringId, manager);
        if (!offering || !offering.isActive || offering.providerId !== data.providerId) {
          throw new AppError("service_offerings.not_found", "Service offering not found.", 404);
        }

        serviceName = offering.name;
      }

      const hasConflict = await this.bookingsRepository.hasConflict(
        organization.id,
        data.providerId,
        startsAt,
        endsAt,
        manager,
      );

      if (hasConflict) {
        throw new AppError("bookings.time_conflict", "Selected time is no longer available.", 409);
      }

      const customer =
        (await this.customersRepository.findByPhoneOrEmailInOrganization(
          organization.id,
          { email: data.email ?? null, phone: data.phone },
          manager,
        )) ??
        (await this.customersRepository.create(
          organization.id,
          {
            fullName: data.fullName,
            email: data.email ?? null,
            phone: data.phone,
          },
          manager,
        ));

      const paymentBreakdown: PaymentBreakdown = this.paymentsService
        ? await this.paymentsService.buildBreakdown(
          organization.id,
          data.providerId,
          data.offeringId ?? null,
          data.paymentType,
          manager,
        )
        : {
          paymentType: data.paymentType,
          originalAmountCents: 0,
          discountedAmountCents: 0,
          onlineDiscountCents: 0,
          platformCommissionRateBps: 1000,
          platformCommissionCents: 0,
          providerNetAmountCents: 0,
          paymentStatus: data.paymentType === "online" ? "pending" as const : "pending_local" as const,
        };

      let booking = await this.bookingsRepository.create(
        {
          organizationId: organization.id,
          customerId: customer.id,
          providerId: data.providerId,
          offeringId: data.offeringId ?? null,
          createdByUserId: null,
          status: "scheduled",
          startsAt,
          endsAt,
          notes: data.notes ?? null,
          ...paymentBreakdown,
        },
        manager,
      );

      if (data.paymentType === "online") {
        if (!this.paymentsService) {
          throw new AppError("payments.unavailable", "Payments service unavailable.", 500);
        }

        booking = await this.paymentsService.prepareOnlinePayment({
          booking,
          ...(customer.email === undefined ? {} : { customerEmail: customer.email }),
          serviceName,
          manager,
        });
      }

      await this.auditRepository.create(
        {
          organizationId: organization.id,
          actorId: null,
          action: "booking.public_created",
          targetType: "booking",
          targetId: booking.id,
        },
        manager,
      );

      await this.notificationsService.handleBookingEvent(
        {
          id: "public-booking",
          organizationId: organization.id,
          role: "administrator",
          sessionId: "public-booking",
        },
        {
          type: "booking.created",
          booking,
        },
        manager,
      );

      return booking;
    });
  }
}
