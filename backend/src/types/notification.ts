export const notificationChannels = ["whatsapp", "email"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationLeadTimeUnits = ["hours"] as const;
export type NotificationLeadTimeUnit = (typeof notificationLeadTimeUnits)[number];

export type WhatsAppReminderRule = {
  hoursBefore: number;
};

export type WhatsAppReminderSettings = {
  clinicId: string;
  channel: "whatsapp";
  isEnabled: boolean;
  reminders: WhatsAppReminderRule[];
};

export type WhatsAppReminderSettingsInput = {
  isEnabled: boolean;
  reminders: WhatsAppReminderRule[];
};

export const appointmentNotificationStatuses = [
  "pending",
  "processing",
  "sent",
  "cancelled",
  "failed",
] as const;

export type AppointmentNotificationStatus = (typeof appointmentNotificationStatuses)[number];

export type AppointmentNotification = {
  id: string;
  clinicId: string;
  appointmentId: string;
  channel: "whatsapp";
  status: AppointmentNotificationStatus;
  scheduledFor: string;
  sentAt?: string | null;
  cancelledAt?: string | null;
  failedAt?: string | null;
  hoursBefore: number;
  patientPhone: string;
  message: string;
  externalMessageId?: string | null;
  lastError?: string | null;
};

export type ProcessDueNotificationsResult = {
  processedCount: number;
  sentCount: number;
  failedCount: number;
  items: AppointmentNotification[];
};
