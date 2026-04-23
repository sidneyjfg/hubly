"use client";

import {
  apiRoutes,
  type AppointmentDTO,
  type AppointmentWriteDTO,
  type AuthSessionDTO,
  type ClinicDTO,
  type IntegrationSummaryDTO,
  type MeResponseDTO,
  type NoShowOverviewDTO,
  type PatientDTO,
  type PatientWriteDTO,
  type ProfessionalServiceDTO,
  type ProfessionalServiceWriteDTO,
  type ProfessionalWriteDTO,
  type SignInInputDTO,
  type SignUpInputDTO,
  type UpdateAccountInputDTO,
  type UpdateClinicInputDTO,
  type UpdatePasswordInputDTO,
  type WhatsAppConnectionStatusDTO,
  type WhatsAppDisconnectResultDTO,
  type WhatsAppReminderSettingsDTO,
  type WhatsAppSessionConnectResultDTO
} from "@/lib/backend-contract";
import { apiRequest } from "@/lib/api-client";
import type { Professional, WhatsAppReminderRule } from "@/lib/types";

type AppointmentScheduleResponse = {
  referenceDate: string;
  startDate: string;
  endDate: string;
  items: AppointmentDTO[];
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

  updateClinic(id: string, input: UpdateClinicInputDTO) {
    return apiRequest<ClinicDTO>(apiRoutes.clinics.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  getPatients(query: PaginationQuery = {}) {
    return apiRequest<PaginatedResponse<PatientDTO>>(apiRoutes.patients.list, {
      auth: true,
      query: {
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  createPatient(input: PatientWriteDTO) {
    return apiRequest<PatientDTO>(apiRoutes.patients.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  updatePatient(id: string, input: PatientWriteDTO) {
    return apiRequest<PatientDTO>(apiRoutes.patients.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  setPatientStatus(id: string, isActive: boolean) {
    return apiRequest<PatientDTO>(apiRoutes.patients.status(id), {
      method: "PATCH",
      auth: true,
      body: { isActive }
    });
  },

  getProfessionals(query: PaginationQuery = {}) {
    return apiRequest<PaginatedResponse<Professional>>(apiRoutes.professionals.list, {
      auth: true,
      query: {
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  createProfessional(input: ProfessionalWriteDTO) {
    return apiRequest<Professional>(apiRoutes.professionals.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  updateProfessional(id: string, input: ProfessionalWriteDTO) {
    return apiRequest<Professional>(apiRoutes.professionals.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  setProfessionalStatus(id: string, isActive: boolean) {
    return apiRequest<Professional>(apiRoutes.professionals.status(id), {
      method: "PATCH",
      auth: true,
      body: { isActive }
    });
  },

  getProfessionalServices(query: PaginationQuery & { professionalId?: string } = {}) {
    return apiRequest<PaginatedResponse<ProfessionalServiceDTO>>(apiRoutes.professionalServices.list, {
      auth: true,
      query: {
        limit: query.limit?.toString(),
        page: query.page?.toString(),
        professionalId: query.professionalId
      }
    });
  },

  createProfessionalService(input: ProfessionalServiceWriteDTO) {
    return apiRequest<ProfessionalServiceDTO>(apiRoutes.professionalServices.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  updateProfessionalService(id: string, input: ProfessionalServiceWriteDTO) {
    return apiRequest<ProfessionalServiceDTO>(apiRoutes.professionalServices.update(id), {
      method: "PATCH",
      auth: true,
      body: input
    });
  },

  setProfessionalServiceStatus(id: string, isActive: boolean) {
    return apiRequest<ProfessionalServiceDTO>(apiRoutes.professionalServices.status(id), {
      method: "PATCH",
      auth: true,
      body: { isActive }
    });
  },

  getAppointments(query?: { from?: string; limit?: number; page?: number; to?: string }) {
    return apiRequest<PaginatedResponse<AppointmentDTO>>(apiRoutes.appointments.list, {
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
    return apiRequest<AppointmentScheduleResponse>(apiRoutes.appointments.dailySchedule, {
      auth: true,
      query: {
        date: date.slice(0, 10),
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  getWeeklySchedule(date: string, query: PaginationQuery = {}) {
    return apiRequest<AppointmentScheduleResponse>(apiRoutes.appointments.weeklySchedule, {
      auth: true,
      query: {
        date: date.slice(0, 10),
        limit: query.limit?.toString(),
        page: query.page?.toString()
      }
    });
  },

  createAppointment(input: AppointmentWriteDTO) {
    return apiRequest<AppointmentDTO>(apiRoutes.appointments.create, {
      method: "POST",
      auth: true,
      body: input
    });
  },

  cancelAppointment(id: string, notes?: string) {
    return apiRequest<AppointmentDTO>(apiRoutes.appointments.cancel(id), {
      method: "PATCH",
      auth: true,
      body: {
        notes: notes ?? null
      }
    });
  },

  markAppointmentAttended(id: string, notes?: string) {
    return apiRequest<AppointmentDTO>(apiRoutes.appointments.attendance(id), {
      method: "PATCH",
      auth: true,
      body: {
        notes: notes ?? null
      }
    });
  },

  markAppointmentMissed(id: string, notes?: string) {
    return apiRequest<AppointmentDTO>(apiRoutes.appointments.missed(id), {
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
  }
};
