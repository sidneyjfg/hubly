export const bookingStatuses = [
  "scheduled",
  "confirmed",
  "cancelled",
  "rescheduled",
  "attended",
  "missed",
] as const;

export type BookingStatus = (typeof bookingStatuses)[number];

export type Booking = {
  id: string;
  organizationId: string;
  customerId: string;
  providerId: string;
  offeringId?: string | null;
  createdByUserId?: string | null;
  customerName?: string;
  providerName?: string;
  serviceName?: string | null;
  status: BookingStatus;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
  paymentType: BookingPaymentType;
  originalAmountCents: number;
  discountedAmountCents: number;
  onlineDiscountCents: number;
  platformCommissionRateBps: number;
  platformCommissionCents: number;
  providerNetAmountCents: number;
  paymentStatus: BookingPaymentStatus;
  paymentCheckoutUrl?: string | null;
};

export type BookingWriteInput = {
  customerId: string;
  providerId: string;
  offeringId?: string | null;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
};

export type BookingPaymentType = "online" | "presential";

export type BookingPaymentStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "pending_local";

export type BookingStatusUpdateInput = {
  notes?: string | null;
};

export type BookingSchedule = {
  referenceDate: string;
  startDate: string;
  endDate: string;
  items: Booking[];
};

export type NoShowOverview = {
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  attendedBookings: number;
  missedBookings: number;
  noShowRate: number;
};

export type BookingAvailabilityQuery = {
  providerId: string;
  date: string;
  offeringId?: string | null;
};
