import type { DataSource } from "typeorm";
import { z } from "zod";

import { AuditRepository } from "../repositories/audit.repository";
import { BookingsRepository, isBookingBlockingSlot } from "../repositories/bookings.repository";
import { CustomersRepository } from "../repositories/customers.repository";
import {
  isStorefrontBookingAutomationReady,
  OrganizationNotificationSettingsRepository,
} from "../repositories/organization-notification-settings.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import { ProviderAvailabilitiesRepository } from "../repositories/provider-availabilities.repository";
import { ProvidersRepository } from "../repositories/providers.repository";
import { ServiceOfferingsRepository } from "../repositories/service-offerings.repository";
import type { Booking, BookingAvailabilityQuery } from "../types/booking";
import type { PublicAvailableSlot, PublicBookingPage, PublicBookingRequestInput } from "../types/provider";
import { AppError } from "../utils/app-error";
import { hashPassword, verifyPassword } from "../utils/password";
import { brazilianWhatsAppPhoneSchema, normalizeBrazilianWhatsAppPhone } from "../utils/phone";
import {
  buildAvailableSlots,
  buildUtcRangeForLocalDate,
  isWithinProviderAvailability,
  resolveWeekday,
  resolveWeekdayInTimeZone,
} from "../utils/provider-availability";
import { createCustomerAccessToken, verifyCustomerAccessToken } from "../utils/customer-tokens";
import { defaultTimeZone } from "../utils/timezone";
import { NotificationsService } from "./notifications.service";
import { PlanEntitlementsService } from "./plan-entitlements.service";

const publicBookingRequestSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email().nullable().optional(),
  phone: brazilianWhatsAppPhoneSchema,
  password: z.string().min(8).max(120).optional(),
  customerAccessToken: z.string().min(20).optional(),
  providerId: z.string().min(3),
  offeringId: z.string().min(3).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().max(255).nullable().optional(),
});

const availabilityQuerySchema = z.object({
  providerId: z.string().min(3),
  date: z.string().date(),
  offeringId: z.string().min(3).nullable().optional(),
});

const customerSignUpSchema = z.object({
  slug: z.string().min(3).optional(),
  fullName: z.string().min(3).max(120),
  email: z.string().email().nullable().optional(),
  phone: brazilianWhatsAppPhoneSchema,
  password: z.string().min(8).max(120),
});

const customerSignInSchema = z.object({
  emailOrPhone: z.string().min(5).max(160),
  password: z.string().min(8).max(120),
});

type CustomerPortalSession = {
  accessToken: string;
  customer: {
    id: string;
    fullName: string;
    email?: string | null;
    phone: string;
  };
};

export class PublicBookingsService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly providersRepository: ProvidersRepository,
    private readonly serviceOfferingsRepository: ServiceOfferingsRepository,
    private readonly providerAvailabilitiesRepository: ProviderAvailabilitiesRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly bookingsRepository: BookingsRepository,
    private readonly organizationNotificationSettingsRepository: OrganizationNotificationSettingsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly auditRepository: AuditRepository,
    private readonly planEntitlementsService: PlanEntitlementsService,
  ) {}

  public async getBookingPage(slug: string): Promise<PublicBookingPage> {
    const organization = await this.organizationsRepository.findByBookingPageSlug(slug);
    if (!organization) {
      throw new AppError("public_booking.organization_not_found", "Organization not found.", 404);
    }

    const page = await this.buildReadyBookingPage(organization);
    if (!page) {
      throw new AppError("public_booking.organization_not_ready", "Organization is not ready for public bookings.", 404);
    }

    return page;
  }

  public async listPublishedBookingPages(): Promise<{ items: PublicBookingPage[] }> {
    const organizations = await this.organizationsRepository.findPublishedStorefronts({ page: 1, limit: 100 });
    const pages = await Promise.all(
      organizations.items.map((organization) => this.buildReadyBookingPage(organization)),
    );

    return { items: pages.filter((page): page is PublicBookingPage => page !== null) };
  }

  private async buildReadyBookingPage(organization: {
    id: string;
    bookingPageSlug: string;
    tradeName: string;
    timezone: string;
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
    galleryImageUrls: string[];
    isStorefrontPublished: boolean;
  }): Promise<PublicBookingPage | null> {
    if (!organization.isStorefrontPublished || !this.hasMinimumPublicProfile(organization)) {
      return null;
    }

    const serviceLimitStatus = await this.planEntitlementsService.getServiceOfferingLimitStatus(organization.id);
    if (serviceLimitStatus.isPublicAccessBlocked) {
      return null;
    }

    const automationSettings = await this.organizationNotificationSettingsRepository.findBookingEventsByOrganization(organization.id);
    if (!isStorefrontBookingAutomationReady(automationSettings)) {
      return null;
    }

    const [providers, serviceOfferings] = await Promise.all([
      this.providersRepository.findActiveByOrganization(organization.id),
      this.serviceOfferingsRepository.findActiveByOrganization(organization.id),
    ]);

    const readyProviderIds = await this.findReadyProviderIds(organization.id, providers, serviceOfferings);
    if (readyProviderIds.size === 0) {
      return null;
    }

    const readyProviders = providers.filter((provider) => readyProviderIds.has(provider.id));
    const readyServiceOfferings = serviceOfferings.filter(
      (service) => readyProviderIds.has(service.providerId) && (service.priceCents ?? 0) > 0,
    );

    return {
      organizationId: organization.id,
      bookingPageSlug: organization.bookingPageSlug,
      tradeName: organization.tradeName,
      timezone: defaultTimeZone,
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
      providers: readyProviders,
      serviceOfferings: readyServiceOfferings,
    };
  }

  private hasMinimumPublicProfile(organization: {
    tradeName: string;
    publicDescription?: string | null;
    publicPhone?: string | null;
    publicEmail?: string | null;
    addressLine?: string | null;
    city?: string | null;
    state?: string | null;
    coverImageUrl?: string | null;
    logoImageUrl?: string | null;
    galleryImageUrls: string[];
  }): boolean {
    return Boolean(
      organization.tradeName.trim()
        && organization.publicDescription?.trim()
        && (organization.publicPhone?.trim() || organization.publicEmail?.trim())
        && organization.addressLine?.trim()
        && organization.city?.trim()
        && organization.state?.trim()
        && organization.coverImageUrl?.trim()
    );
  }

  private async findReadyProviderIds(
    organizationId: string,
    providers: Array<{ id: string }>,
    serviceOfferings: Array<{ providerId: string; priceCents?: number | null }>,
  ): Promise<Set<string>> {
    const readyProviderIds = new Set<string>();

    await Promise.all(providers.map(async (provider) => {
      const hasPricedService = serviceOfferings.some(
        (service) => service.providerId === provider.id && (service.priceCents ?? 0) > 0,
      );
      if (!hasPricedService) {
        return;
      }

      const availability = await this.providerAvailabilitiesRepository.findByProviderInOrganization(organizationId, provider.id);
      const hasActiveAvailability = availability.some((item) => item.isActive);

      if (hasActiveAvailability) {
        // Agora permitimos se houver disponibilidade ativa. 
        // A decisão de mostrar "Online" ou apenas "Presencial" será feita no frontend baseada nas settings.
        readyProviderIds.add(provider.id);
      }
    }));

    return readyProviderIds;
  }

  public async getAvailableSlots(slug: string, query: BookingAvailabilityQuery): Promise<{ items: PublicAvailableSlot[] }> {
    const organization = await this.organizationsRepository.findByBookingPageSlug(slug);
    if (!organization) {
      throw new AppError("public_booking.organization_not_found", "Organization not found.", 404);
    }
    await this.assertPublicBookingAccessIsAvailable(organization.id);

    const data = availabilityQuerySchema.parse(query);
    const organizationTimeZone = defaultTimeZone;
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

    const { start: dayStart, end: dayEnd } = buildUtcRangeForLocalDate(data.date, organizationTimeZone);
    const existingBookings = await this.bookingsRepository.findAll(organization.id, {
      from: dayStart,
      to: dayEnd,
      pagination: { page: 1, limit: 500 },
    });

    const busyWindows = existingBookings.items
      .filter((booking) => booking.providerId === data.providerId && isBookingBlockingSlot(booking))
      .map((booking) => ({
        startsAt: new Date(booking.startsAt),
        endsAt: new Date(booking.endsAt),
      }));

    return {
      items: buildAvailableSlots(data.date, availability, durationMinutes, busyWindows, organizationTimeZone),
    };
  }

  public async signUpCustomer(input: unknown): Promise<CustomerPortalSession> {
    const data = customerSignUpSchema.parse(input);
    const passwordHash = hashPassword(data.password);

    if (!data.slug) {
      const customer = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
        const candidates = await this.customersRepository.findAuthCandidatesByEmailOrPhone(data.email ?? data.phone);
        const existingCustomer = candidates.find((candidate) => (
          candidate.phone === data.phone || Boolean(data.email && candidate.email === data.email)
        ));

        if (existingCustomer?.passwordHash && !verifyPassword(data.password, existingCustomer.passwordHash)) {
          throw new AppError("customer_auth.account_exists", "Já existe uma conta com estes dados. Entre com sua senha atual.", 409);
        }

        if (existingCustomer) {
          await this.customersRepository.setPortalPasswordHashIfMissing(existingCustomer.id, passwordHash, manager);
          return existingCustomer;
        }

        return this.customersRepository.createPortalAccount(
          {
            fullName: data.fullName,
            email: data.email ?? null,
            phone: data.phone,
            passwordHash,
          },
          manager,
        );
      });

      return this.buildCustomerSession(customer);
    }

    const organization = await this.organizationsRepository.findByBookingPageSlug(data.slug);
    if (!organization) {
      throw new AppError("public_booking.organization_not_found", "Estabelecimento não encontrado.", 404);
    }

    const customer = await this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      const existingCustomer = await this.customersRepository.findAuthCandidateInOrganization(
        organization.id,
        { email: data.email ?? null, phone: data.phone },
        manager,
      );

      if (existingCustomer?.passwordHash && !verifyPassword(data.password, existingCustomer.passwordHash)) {
        throw new AppError("customer_auth.account_exists", "Já existe uma conta com estes dados. Entre com sua senha atual.", 409);
      }

      if (existingCustomer) {
        await this.customersRepository.setPasswordHashIfMissing(organization.id, existingCustomer.id, passwordHash, manager);
        return existingCustomer;
      }

      await this.planEntitlementsService.assertCanCreateCustomer(organization.id, manager);

      return this.customersRepository.create(
        organization.id,
        {
          fullName: data.fullName,
          email: data.email ?? null,
          phone: data.phone,
          passwordHash,
        },
        manager,
      );
    });

    return this.buildCustomerSession(customer);
  }

  public async signInCustomer(input: unknown): Promise<CustomerPortalSession> {
    const data = customerSignInSchema.parse(input);
    const identifier = data.emailOrPhone.includes("@")
      ? data.emailOrPhone.trim().toLowerCase()
      : normalizeBrazilianWhatsAppPhone(data.emailOrPhone) ?? data.emailOrPhone.trim();
    const candidates = await this.customersRepository.findAuthCandidatesByEmailOrPhone(identifier);
    const customer = candidates.find((candidate) => candidate.passwordHash && verifyPassword(data.password, candidate.passwordHash));

    if (!customer) {
      throw new AppError("customer_auth.invalid_credentials", "E-mail, telefone ou senha inválidos.", 401);
    }

    return this.buildCustomerSession(customer);
  }

  public async getCustomerPortal(authorization?: string): Promise<{
    customer: CustomerPortalSession["customer"];
    bookings: Array<Booking & { organizationName: string; organizationSlug: string }>;
    places: Array<{
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      visits: number;
      spentCents: number;
      lastVisitAt: string;
    }>;
  }> {
    const claims = this.requireCustomerClaims(authorization);
    const bookings = await this.bookingsRepository.findByCustomerIdentity({
      email: claims.email ?? null,
      phone: claims.phone,
    });
    const matchingCustomers = await this.customersRepository.findByPortalIdentity({
      email: claims.email ?? null,
      phone: claims.phone,
    });
    const primaryCustomer = matchingCustomers.find((item) => item.id === claims.sub) ?? matchingCustomers[0];

    const placesById = new Map<string, {
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      visits: number;
      spentCents: number;
      lastVisitAt: string;
    }>();

    bookings.forEach((booking) => {
      const current = placesById.get(booking.organizationId) ?? {
        organizationId: booking.organizationId,
        organizationName: booking.organizationName,
        organizationSlug: booking.organizationSlug,
        visits: 0,
        spentCents: 0,
        lastVisitAt: booking.startsAt,
      };

      current.visits += 1;
      current.spentCents += booking.status !== "cancelled" ? booking.discountedAmountCents : 0;
      if (booking.startsAt > current.lastVisitAt) {
        current.lastVisitAt = booking.startsAt;
      }
      placesById.set(booking.organizationId, current);
    });

    return {
      customer: {
        id: primaryCustomer?.id ?? claims.sub,
        fullName: primaryCustomer?.fullName ?? "Cliente",
        email: primaryCustomer?.email ?? claims.email ?? null,
        phone: primaryCustomer?.phone ?? claims.phone,
      },
      bookings,
      places: [...placesById.values()].sort((a, b) => b.lastVisitAt.localeCompare(a.lastVisitAt)),
    };
  }

  private buildCustomerSession(customer: { id: string; fullName: string; email?: string | null; phone: string }): CustomerPortalSession {
    return {
      accessToken: createCustomerAccessToken({
        sub: customer.id,
        email: customer.email ?? null,
        phone: customer.phone,
      }),
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email ?? null,
        phone: customer.phone,
      },
    };
  }

  private requireCustomerClaims(authorization?: string) {
    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError("customer_auth.unauthorized", "Faça login novamente.", 401);
    }

    return verifyCustomerAccessToken(authorization.slice("Bearer ".length));
  }

  public async createBooking(slug: string, input: PublicBookingRequestInput): Promise<Booking> {
    const organization = await this.organizationsRepository.findByBookingPageSlug(slug);
    if (!organization) {
      throw new AppError("public_booking.organization_not_found", "Organization not found.", 404);
    }
    await this.assertPublicBookingAccessIsAvailable(organization.id);

    const data = publicBookingRequestSchema.parse({
      ...input,
      email: input.email ?? null,
      notes: input.notes ?? null,
      offeringId: input.offeringId ?? null,
    });

    if (!data.password && !data.customerAccessToken) {
      throw new AppError("customer_auth.required", "Crie uma conta ou entre antes de agendar.", 400);
    }

    if (data.customerAccessToken) {
      const claims = verifyCustomerAccessToken(data.customerAccessToken);
      const emailMatches = data.email && claims.email && data.email === claims.email;
      if (claims.phone !== data.phone && !emailMatches) {
        throw new AppError("customer_auth.invalid_session", "A sessão do cliente não corresponde aos dados informados.", 401);
      }
    }

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new AppError("bookings.invalid_window", "Invalid booking window.", 400);
    }

    return this.dataSource.transaction("SERIALIZABLE", async (manager) => {
      await this.planEntitlementsService.assertCanCreateBooking(organization.id, startsAt, manager);

      const provider = await this.providersRepository.findByIdInOrganization(organization.id, data.providerId, manager);
      if (!provider || !provider.isActive) {
        throw new AppError("providers.not_found", "Provider not found.", 404);
      }

      const organizationTimeZone = defaultTimeZone;
      const weekday = resolveWeekdayInTimeZone(startsAt, organizationTimeZone);
      const availability = await this.providerAvailabilitiesRepository.findByProviderAndWeekdayInOrganization(
        organization.id,
        data.providerId,
        weekday,
        manager,
      );

      if (!availability || !isWithinProviderAvailability(availability, startsAt, endsAt, organizationTimeZone)) {
        throw new AppError("bookings.outside_provider_availability", "Booking is outside provider working hours.", 409);
      }

      if (data.offeringId) {
        const offering = await this.serviceOfferingsRepository.findByIdInOrganization(organization.id, data.offeringId, manager);
        if (!offering || !offering.isActive || offering.providerId !== data.providerId) {
          throw new AppError("service_offerings.not_found", "Service offering not found.", 404);
        }
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

      const customerPasswordHash = data.password ? hashPassword(data.password) : null;
      const existingCustomer = await this.customersRepository.findByPhoneOrEmailInOrganization(
        organization.id,
        { email: data.email ?? null, phone: data.phone },
        manager,
      );
      if (!existingCustomer) {
        await this.planEntitlementsService.assertCanCreateCustomer(organization.id, manager);
      }

      const customer = existingCustomer ?? await this.customersRepository.create(
        organization.id,
        {
          fullName: data.fullName,
          email: data.email ?? null,
          phone: data.phone,
          passwordHash: customerPasswordHash ?? null,
        },
        manager,
      );

      if (existingCustomer && customerPasswordHash) {
        await this.customersRepository.setPasswordHashIfMissing(
          organization.id,
          existingCustomer.id,
          customerPasswordHash,
          manager,
        );
      }

      const originalAmountCents = data.offeringId
        ? (await this.serviceOfferingsRepository.findByIdInOrganization(organization.id, data.offeringId, manager))?.priceCents ?? 0
        : 0;

      const booking = await this.bookingsRepository.create(
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
          originalAmountCents,
          discountedAmountCents: originalAmountCents,
        },
        manager,
      );

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

  private async assertPublicBookingAccessIsAvailable(organizationId: string): Promise<void> {
    const serviceLimitStatus = await this.planEntitlementsService.getServiceOfferingLimitStatus(organizationId);
    if (serviceLimitStatus.isPublicAccessBlocked) {
      throw new AppError(
        "public_booking.plan_limit_regularization_expired",
        "Este estabelecimento precisa regularizar os serviços do plano antes de receber agendamentos.",
        404,
      );
    }
  }
}
