"use client";

import {
  apiRoutes,
  type BookingDTO,
  type BookingWriteDTO,
  type AuthSessionDTO,
  type OrganizationDTO,
  type IntegrationSummaryDTO,
  type MeResponseDTO,
  type MercadoPagoConnectUrlDTO,
  type NoShowOverviewDTO,
  type CustomerDTO,
  type CustomerWriteDTO,
  type OrganizationPaymentSettingsDTO,
  type ProviderPaymentSettingsDTO,
  type ProviderPaymentSettingsUpdateDTO,
  type ProviderAvailabilityDTO,
  type ServiceOfferingDTO,
  type ServiceOfferingWriteDTO,
  type ProviderWriteDTO,
  type PublicAvailableSlotDTO,
  type PublicBookingPageDTO,
  type PublicBookingWriteDTO,
  type SignInInputDTO,
  type SignUpInputDTO,
  type UpdateAccountInputDTO,
  type UpdateOrganizationInputDTO,
  type UpdatePasswordInputDTO,
  type UpdateStorefrontInputDTO,
  type WhatsAppConnectionStatusDTO,
  type WhatsAppDisconnectResultDTO,
  type WhatsAppReminderSettingsDTO,
  type WhatsAppSessionConnectResultDTO
} from "@/lib/backend-contract";
import { apiRequest } from "@/lib/api-client";
import type { Provider, WhatsAppReminderRule } from "@/lib/types";

type BookingScheduleResponse = {
  referenceDate: string;
  startDate: string;
  endDate: string;
  items: BookingDTO[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type PaginationQuery = {
  limit?: number;
  page?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

type IntegrationListResponse = {
  items: IntegrationSummaryDTO[];
};

type ChannelsResponse = {
  items: string[];
};

type ProcessResult = {
  processedCount: number;
  sentCount: number;
  failedCount: number;
};

type PublicOrganizationsResponse = {
  items: PublicBookingPageDTO[];
};

type PublicAvailabilityResponse = {
  items: PublicAvailableSlotDTO[];
};

export const api = {
  signIn(input: SignInInputDTO) {
    return apiRequest<AuthSessionDTO>(apiRoutes.auth.signIn, {
      method: "POST",
      body: input
    });
  },

  signUp(input: SignUpInputDTO) {
    return apiRequest<AuthSessionDTO>(apiRoutes.auth.signUp, {
      method: "POST",
      body: input
    });
  },

  getMe() {
    return apiRequest<MeResponseDTO>(apiRoutes.auth.me, {
      auth: true
    });
  },

  updateAccount(input: UpdateAccountInputDTO) {
    return apiRequest<MeResponseDTO>(apiRoutes.auth.account, {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  updatePassword(input: UpdatePasswordInputDTO) {
    return apiRequest<{ message: string }>(apiRoutes.auth.password, {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  updateOrganization(id: string, input: UpdateOrganizationInputDTO) {
    return apiRequest<OrganizationDTO>(apiRoutes.organizations.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  getStorefront() {
    return apiRequest<OrganizationDTO>(apiRoutes.organizations.storefront, {
      auth: true
    });
  },

  updateStorefront(input: UpdateStorefrontInputDTO) {
    return apiRequest<OrganizationDTO>(apiRoutes.organizations.storefront, {
      method: "PUT",
      auth: true,
      body: input
    });
  },

  getOrganizationPaymentSettings() {
    return apiRequest<OrganizationPaymentSettingsDTO>(apiRoutes.organizations.paymentSettings, {
      auth: true
    });
  },

  updateOrganizationPaymentSettings(input: ProviderPaymentSettingsUpdateDTO) {
    return apiRequest<OrganizationPaymentSettingsDTO>(apiRoutes.organizations.paymentSettings, {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  createOrganizationMercadoPagoConnectUrl() {
    return apiRequest<MercadoPagoConnectUrlDTO>(apiRoutes.organizations.mercadoPagoConnect, {
      method: "POST",
      auth: true
    });
  },

  getCustomers(query: PaginationQuery = {}) {
    return apiRequest<PaginatedResponse<CustomerDTO>>(apiRoutes.customers.list, {
      auth: true,
      query: {
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  createCustomer(input: CustomerWriteDTO) {
    return apiRequest<CustomerDTO>(apiRoutes.customers.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  updateCustomer(id: string, input: CustomerWriteDTO) {
    return apiRequest<CustomerDTO>(apiRoutes.customers.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  setCustomerStatus(id: string, isActive: boolean) {
    return apiRequest<CustomerDTO>(apiRoutes.customers.status(id), {
      method: "PATCH",
      auth: true,
      body: { isActive }
    });
  },

  getProviders(query: PaginationQuery = {}) {
    return apiRequest<PaginatedResponse<Provider>>(apiRoutes.providers.list, {
      auth: true,
      query: {
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  createProvider(input: ProviderWriteDTO) {
    return apiRequest<Provider>(apiRoutes.providers.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  updateProvider(id: string, input: ProviderWriteDTO) {
    return apiRequest<Provider>(apiRoutes.providers.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  setProviderStatus(id: string, isActive: boolean) {
    return apiRequest<Provider>(apiRoutes.providers.status(id), {
      method: "PATCH",
      auth: true,
      body: { isActive }
    });
  },

  getProviderPaymentSettings(providerId: string) {
    return apiRequest<ProviderPaymentSettingsDTO>(apiRoutes.providers.paymentSettings(providerId), {
      auth: true
    });
  },

  updateProviderPaymentSettings(providerId: string, input: ProviderPaymentSettingsUpdateDTO) {
    return apiRequest<ProviderPaymentSettingsDTO>(apiRoutes.providers.paymentSettings(providerId), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  createMercadoPagoConnectUrl(providerId: string) {
    return apiRequest<MercadoPagoConnectUrlDTO>(apiRoutes.providers.mercadoPagoConnect(providerId), {
      method: "POST",
      auth: true
    });
  },

  getProviderAvailability(providerId: string) {
    return apiRequest<ProviderAvailabilityDTO[]>(apiRoutes.providers.availability(providerId), {
      auth: true
    });
  },

  getServiceOfferings(query: PaginationQuery & { providerId?: string } = {}) {
    return apiRequest<PaginatedResponse<ServiceOfferingDTO>>(apiRoutes.serviceOfferings.list, {
      auth: true,
      query: {
        limit: query.limit?.toString(),
        page: query.page?.toString(),
        providerId: query.providerId
      }
    });
  },

  createServiceOffering(input: ServiceOfferingWriteDTO) {
    return apiRequest<ServiceOfferingDTO>(apiRoutes.serviceOfferings.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  updateServiceOffering(id: string, input: ServiceOfferingWriteDTO) {
    return apiRequest<ServiceOfferingDTO>(apiRoutes.serviceOfferings.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  setServiceOfferingStatus(id: string, isActive: boolean) {
    return apiRequest<ServiceOfferingDTO>(apiRoutes.serviceOfferings.status(id), {
      method: "PATCH",
      auth: true,
      body: { isActive }
    });
  },

  getBookings(query?: { from?: string; limit?: number; page?: number; to?: string }) {
    return apiRequest<PaginatedResponse<BookingDTO>>(apiRoutes.bookings.list, {
      auth: true,
      query: {
        from: query?.from,
        limit: query?.limit?.toString(),
        page: query?.page?.toString(),
        to: query?.to
      }
    });
  },

  getDailySchedule(date: string, query: PaginationQuery = {}) {
    return apiRequest<BookingScheduleResponse>(apiRoutes.bookings.dailySchedule, {
      auth: true,
      query: {
        date: date.slice(0, 10),
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  getWeeklySchedule(date: string, query: PaginationQuery = {}) {
    return apiRequest<BookingScheduleResponse>(apiRoutes.bookings.weeklySchedule, {
      auth: true,
      query: {
        date: date.slice(0, 10),
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  createBooking(input: BookingWriteDTO) {
    return apiRequest<BookingDTO>(apiRoutes.bookings.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  cancelBooking(id: string, notes?: string) {
    return apiRequest<BookingDTO>(apiRoutes.bookings.cancel(id), {
      method: "PATCH",
      auth: true,
      body: {
        notes: notes ?? null
      }
    });
  },

  markBookingAttended(id: string, notes?: string) {
    return apiRequest<BookingDTO>(apiRoutes.bookings.attendance(id), {
      method: "PATCH",
      auth: true,
      body: {
        notes: notes ?? null
      }
    });
  },

  markBookingMissed(id: string, notes?: string) {
    return apiRequest<BookingDTO>(apiRoutes.bookings.missed(id), {
      method: "PATCH",
      auth: true,
      body: {
        notes: notes ?? null
      }
    });
  },

  getNoShowOverview(query: { from: string; to: string }) {
    return apiRequest<NoShowOverviewDTO>(apiRoutes.reports.noShowOverview, {
      auth: true,
      query: {
        from: query.from.slice(0, 10),
        to: query.to.slice(0, 10)
      }
    });
  },

  getNotificationChannels() {
    return apiRequest<ChannelsResponse>(apiRoutes.notifications.channels, {
      auth: true
    });
  },

  getWhatsAppSettings() {
    return apiRequest<WhatsAppReminderSettingsDTO>(apiRoutes.notifications.whatsappSettings, {
      auth: true
    });
  },

  updateWhatsAppSettings(input: { isEnabled: boolean; reminders: WhatsAppReminderRule[] }) {
    return apiRequest<WhatsAppReminderSettingsDTO>(apiRoutes.notifications.whatsappSettings, {
      method: "PUT",
      auth: true,
      body: input
    });
  },

  processDueWhatsApp(limit = 25) {
    return apiRequest<ProcessResult>(apiRoutes.notifications.process, {
      method: "POST",
      auth: true,
      body: { limit }
    });
  },

  listIntegrations() {
    return apiRequest<IntegrationListResponse>(apiRoutes.integrations.list, {
      auth: true
    });
  },

  getWhatsAppStatus() {
    return apiRequest<WhatsAppConnectionStatusDTO>(apiRoutes.integrations.whatsappStatus, {
      auth: true
    });
  },

  startWhatsAppSession(phoneNumber: string) {
    return apiRequest<WhatsAppSessionConnectResultDTO>(apiRoutes.integrations.whatsappSession, {
      method: "POST",
      auth: true,
      body: { phoneNumber }
    });
  },

  regenerateWhatsAppCode(phoneNumber: string) {
    return apiRequest<WhatsAppSessionConnectResultDTO>(apiRoutes.integrations.whatsappRegenerateCode, {
      method: "POST",
      auth: true,
      body: { phoneNumber }
    });
  },

  disconnectWhatsApp() {
    return apiRequest<WhatsAppDisconnectResultDTO>(apiRoutes.integrations.whatsappDisconnect, {
      method: "POST",
      auth: true
    });
  },

  listPublicOrganizations() {
    return apiRequest<PublicOrganizationsResponse>(apiRoutes.publicOrganizations.list);
  },

  getPublicOrganization(slug: string) {
    return apiRequest<PublicBookingPageDTO>(apiRoutes.publicOrganizations.detail(slug));
  },

  getPublicAvailability(slug: string, query: { providerId: string; date: string; offeringId?: string | null }) {
    return apiRequest<PublicAvailabilityResponse>(apiRoutes.publicOrganizations.availability(slug), {
      query: {
        providerId: query.providerId,
        date: query.date,
        offeringId: query.offeringId ?? undefined
      }
    });
  },

  createPublicBooking(slug: string, input: PublicBookingWriteDTO) {
    return apiRequest<BookingDTO>(apiRoutes.publicOrganizations.bookings(slug), {
      method: "POST",
      body: input
    });
  }
};
