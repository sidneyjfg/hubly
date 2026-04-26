export const notificationChannels = ["whatsapp", "email"] as const;
export type NotificationChannel = (typeof notificationChannels)[number];

export const notificationLeadTimeUnits = ["hours"] as const;
export type NotificationLeadTimeUnit = (typeof notificationLeadTimeUnits)[number];

export type WhatsAppReminderRule = {
  hoursBefore: number;
};

export type WhatsAppReminderSettings = {
  organizationId: string;
  channel: "whatsapp";
  isEnabled: boolean;
  reminders: WhatsAppReminderRule[];
};

export type WhatsAppReminderSettingsInput = {
  isEnabled: boolean;
  reminders: WhatsAppReminderRule[];
};

export const bookingNotificationStatuses = [
  "pending",
  "processing",
  "sent",
  "cancelled",
  "failed",
] as const;

export type BookingNotificationStatus = (typeof bookingNotificationStatuses)[number];

export type BookingNotification = {
  id: string;
  organizationId: string;
  bookingId: string;
  channel: "whatsapp";
  status: BookingNotificationStatus;
  scheduledFor: string;
  sentAt?: string | null;
  cancelledAt?: string | null;
  failedAt?: string | null;
  hoursBefore: number;
  customerPhone: string;
  message: string;
  externalMessageId?: string | null;
  lastError?: string | null;
};

export type ProcessDueNotificationsResult = {
  processedCount: number;
  sentCount: number;
  failedCount: number;
  items: BookingNotification[];
};
