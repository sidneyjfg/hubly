export const notificationChannels = ["whatsapp"] as const;
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

export type BookingEventNotificationType = "created" | "confirmed" | "rescheduled" | "cancelled";

export type BookingEventNotificationRule = {
  event: BookingEventNotificationType;
  isEnabled: boolean;
};

export type BookingEventNotificationSettings = {
  organizationId: string;
  channel: "booking_events";
  isEnabled: boolean;
  events: BookingEventNotificationRule[];
};

export type BookingEventNotificationSettingsInput = {
  isEnabled: boolean;
  events: BookingEventNotificationRule[];
};

export type RelationshipCampaignType = "promotion" | "loyalty";
export type RelationshipCampaignChannel = "whatsapp";

export type RelationshipCampaign = {
  id: string;
  title: string;
  type: RelationshipCampaignType;
  audience: string;
  triggerDaysAfterLastBooking: number;
  message: string;
  channels: RelationshipCampaignChannel[];
  isEnabled: boolean;
};

export type RelationshipAutomationSettings = {
  organizationId: string;
  channel: "relationship";
  isEnabled: boolean;
  campaigns: RelationshipCampaign[];
};

export type RelationshipAutomationSettingsInput = {
  isEnabled: boolean;
  campaigns: RelationshipCampaign[];
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
