import type { FastifySchema } from "fastify";

const errorResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["code", "message"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
  },
} as const;

const protectedHeadersSchema = {
  type: "object",
  properties: {
    authorization: {
      type: "string",
      description: "Bearer access token returned by /v1/auth/sign-in.",
      examples: ["Bearer {{accessToken}}"],
    },
    "x-organization-id": {
      type: "string",
      description: "Optional tenant header. When provided it must match the organizationId from the token.",
      examples: ["{{organizationId}}"],
    },
  },
} as const;

const roleSchema = {
  type: "string",
  enum: ["administrator", "reception", "provider"],
} as const;

const authSessionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["accessToken", "refreshToken", "sessionId", "organizationId", "actorId", "role"],
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    sessionId: { type: "string" },
    organizationId: { type: "string" },
    actorId: { type: "string" },
    role: roleSchema,
  },
} as const;

const userSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "organizationId", "fullName", "email", "phone", "role", "isActive", "createdAt"],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    fullName: { type: "string" },
    email: { type: "string", format: "email" },
    phone: { type: "string" },
    role: roleSchema,
    isActive: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

const organizationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "legalName", "tradeName", "bookingPageSlug", "timezone"],
  properties: {
    id: { type: "string" },
    legalName: { type: "string" },
    tradeName: { type: "string" },
    bookingPageSlug: { type: "string" },
    timezone: { type: "string" },
  },
} as const;

const meResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["user", "organization"],
  properties: {
    user: userSchema,
    organization: organizationSchema,
  },
} as const;

const organizationWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["legalName", "tradeName", "timezone"],
  properties: {
    legalName: { type: "string" },
    tradeName: { type: "string" },
    bookingPageSlug: { type: "string" },
    timezone: { type: "string" },
  },
} as const;

const providerSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "organizationId", "fullName", "specialty", "isActive"],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    fullName: { type: "string" },
    specialty: { type: "string" },
    isActive: { type: "boolean" },
  },
} as const;

const providerServiceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "organizationId", "providerId", "name", "durationMinutes", "isActive"],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    providerId: { type: "string" },
    providerName: { type: "string" },
    name: { type: "string" },
    durationMinutes: { type: "integer" },
    priceCents: { type: ["integer", "null"] },
    isActive: { type: "boolean" },
  },
} as const;

const providerServiceWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["providerId", "name", "durationMinutes"],
  properties: {
    providerId: { type: "string" },
    name: { type: "string" },
    durationMinutes: { type: "integer", minimum: 5, maximum: 720 },
    priceCents: { type: ["integer", "null"], minimum: 0 },
    isActive: { type: "boolean" },
  },
} as const;

const providerWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fullName", "specialty"],
  properties: {
    fullName: { type: "string" },
    specialty: { type: "string" },
    isActive: { type: "boolean" },
  },
} as const;

const providerAvailabilitySchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "organizationId", "providerId", "weekday", "workStart", "workEnd", "isActive"],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    providerId: { type: "string" },
    weekday: { type: "integer", minimum: 0, maximum: 6 },
    workStart: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
    workEnd: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
    lunchStart: { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$" },
    lunchEnd: { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$" },
    isActive: { type: "boolean" },
  },
} as const;

const providerAvailabilityWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["weekday", "workStart", "workEnd"],
  properties: {
    weekday: { type: "integer", minimum: 0, maximum: 6 },
    workStart: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
    workEnd: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
    lunchStart: { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$" },
    lunchEnd: { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$" },
    isActive: { type: "boolean" },
  },
} as const;

const customerSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "organizationId", "fullName", "phone", "isActive"],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    fullName: { type: "string" },
    email: { type: ["string", "null"] },
    phone: { type: "string" },
    isActive: { type: "boolean" },
  },
} as const;

const customerWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fullName", "phone"],
  properties: {
    fullName: { type: "string" },
    email: { type: ["string", "null"], format: "email" },
    phone: { type: "string" },
  },
} as const;

const bookingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "organizationId",
    "customerId",
    "providerId",
    "status",
    "startsAt",
    "endsAt",
    "paymentType",
    "paymentStatus",
  ],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    customerId: { type: "string" },
    providerId: { type: "string" },
    offeringId: { type: ["string", "null"] },
    customerName: { type: "string" },
    providerName: { type: "string" },
    serviceName: { type: ["string", "null"] },
    status: {
      type: "string",
      enum: ["scheduled", "confirmed", "cancelled", "rescheduled", "attended", "missed"],
    },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    notes: { type: ["string", "null"] },
    paymentType: { type: "string", enum: ["online", "presential"] },
    originalAmountCents: { type: "number" },
    discountedAmountCents: { type: "number" },
    onlineDiscountCents: { type: "number" },
    platformCommissionRateBps: { type: "number" },
    platformCommissionCents: { type: "number" },
    providerNetAmountCents: { type: "number" },
    paymentStatus: {
      type: "string",
      enum: ["not_required", "pending", "approved", "rejected", "cancelled", "pending_local"],
    },
    paymentCheckoutUrl: { type: ["string", "null"] },
  },
} as const;

const bookingWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["customerId", "providerId", "startsAt", "endsAt"],
  properties: {
    customerId: { type: "string" },
    providerId: { type: "string" },
    offeringId: { type: ["string", "null"] },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    notes: { type: ["string", "null"] },
  },
} as const;

const bookingActionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    notes: { type: ["string", "null"] },
  },
} as const;

const bookingScheduleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["referenceDate", "startDate", "endDate", "items", "page", "limit", "total", "totalPages"],
  properties: {
    referenceDate: { type: "string", format: "date-time" },
    startDate: { type: "string", format: "date-time" },
    endDate: { type: "string", format: "date-time" },
    items: {
      type: "array",
      items: bookingSchema,
    },
    limit: { type: "integer" },
    page: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
} as const;

const publicAvailableSlotSchema = {
  type: "object",
  additionalProperties: false,
  required: ["startsAt", "endsAt", "label"],
  properties: {
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    label: { type: "string" },
  },
} as const;

const publicBookingPageSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "organizationId",
    "bookingPageSlug",
    "tradeName",
    "timezone",
    "galleryImageUrls",
    "isStorefrontPublished",
    "providers",
    "serviceOfferings",
  ],
  properties: {
    organizationId: { type: "string" },
    bookingPageSlug: { type: "string" },
    tradeName: { type: "string" },
    timezone: { type: "string" },
    publicDescription: { type: ["string", "null"] },
    publicPhone: { type: ["string", "null"] },
    publicEmail: { type: ["string", "null"] },
    addressLine: { type: ["string", "null"] },
    addressNumber: { type: ["string", "null"] },
    district: { type: ["string", "null"] },
    city: { type: ["string", "null"] },
    state: { type: ["string", "null"] },
    postalCode: { type: ["string", "null"] },
    coverImageUrl: { type: ["string", "null"] },
    logoImageUrl: { type: ["string", "null"] },
    galleryImageUrls: {
      type: "array",
      items: { type: "string" },
    },
    isStorefrontPublished: { type: "boolean" },
    providers: {
      type: "array",
      items: providerSchema,
    },
    serviceOfferings: {
      type: "array",
      items: providerServiceSchema,
    },
  },
} as const;

const publicBookingAvailabilityResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: publicAvailableSlotSchema,
    },
  },
} as const;

const publicBookingCreateSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fullName", "phone", "providerId", "startsAt", "endsAt"],
  properties: {
    fullName: { type: "string", minLength: 3, maxLength: 120 },
    email: { type: ["string", "null"], format: "email" },
    phone: { type: "string", minLength: 10, maxLength: 30 },
    providerId: { type: "string" },
    offeringId: { type: ["string", "null"] },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    notes: { type: ["string", "null"], maxLength: 255 },
    paymentType: { type: "string", enum: ["online", "presential"], default: "presential" },
  },
} as const;

const publicBookingAvailabilityQuerySchema = {
  type: "object",
  additionalProperties: false,
  required: ["providerId", "date"],
  properties: {
    providerId: { type: "string" },
    date: { type: "string", format: "date" },
    offeringId: { type: ["string", "null"] },
  },
} as const;

const noShowOverviewSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "organizationId",
    "periodStart",
    "periodEnd",
    "totalBookings",
    "attendedBookings",
    "missedBookings",
    "noShowRate",
  ],
  properties: {
    organizationId: { type: "string" },
    periodStart: { type: "string", format: "date-time" },
    periodEnd: { type: "string", format: "date-time" },
    totalBookings: { type: "number" },
    attendedBookings: { type: "number" },
    missedBookings: { type: "number" },
    noShowRate: { type: "number" },
  },
} as const;

const auditEventSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "organizationId", "actorId", "action", "targetType", "targetId", "occurredAt"],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    actorId: { type: "string" },
    action: { type: "string" },
    targetType: { type: "string" },
    targetId: { type: "string" },
    occurredAt: { type: "string", format: "date-time" },
  },
} as const;

const stringListResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

const integrationSummarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "provider", "enabled"],
  properties: {
    id: { type: "string", const: "whatsapp" },
    provider: { type: "string", const: "evolution" },
    enabled: { type: "boolean" },
    phoneNumber: { type: ["string", "null"] },
    status: { type: ["string", "null"] },
  },
} as const;

const whatsappStatusSchema = {
  type: "object",
  additionalProperties: false,
  required: ["state"],
  properties: {
    phoneNumber: { type: ["string", "null"] },
    state: { type: "string" },
  },
} as const;

const whatsappConnectSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pairingCode: { type: "string" },
    code: { type: "string" },
    count: { type: "number" },
  },
} as const;

const whatsappSessionRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: ["phoneNumber"],
  properties: {
    phoneNumber: { type: "string", examples: ["5531995734976"] },
  },
} as const;

const whatsappSessionResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["state", "phoneNumber"],
  properties: {
    state: { type: "string" },
    phoneNumber: { type: "string" },
    pairingCode: { type: "string" },
    code: { type: "string" },
    count: { type: "number" },
  },
} as const;

const whatsappDisconnectResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["state"],
  properties: {
    state: { type: "string" },
  },
} as const;

const whatsappSendTextSchema = {
  type: "object",
  additionalProperties: false,
  required: ["number", "text"],
  properties: {
    number: { type: "string" },
    text: { type: "string" },
  },
} as const;

const whatsappSendTextResponseSchema = {
  type: "object",
  additionalProperties: true,
} as const;

const whatsappReminderRuleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["hoursBefore"],
  properties: {
    hoursBefore: { type: "integer", minimum: 1, maximum: 720 },
  },
} as const;

const whatsappReminderSettingsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["organizationId", "channel", "isEnabled", "reminders"],
  properties: {
    organizationId: { type: "string" },
    channel: { type: "string", const: "whatsapp" },
    isEnabled: { type: "boolean" },
    reminders: {
      type: "array",
      items: whatsappReminderRuleSchema,
    },
  },
} as const;

const whatsappReminderSettingsWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["isEnabled", "reminders"],
  properties: {
    isEnabled: { type: "boolean" },
    reminders: {
      type: "array",
      items: whatsappReminderRuleSchema,
      maxItems: 10,
    },
  },
} as const;

const bookingNotificationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "organizationId",
    "bookingId",
    "channel",
    "status",
    "scheduledFor",
    "hoursBefore",
    "customerPhone",
    "message",
  ],
  properties: {
    id: { type: "string" },
    organizationId: { type: "string" },
    bookingId: { type: "string" },
    channel: { type: "string", const: "whatsapp" },
    status: { type: "string", enum: ["pending", "processing", "sent", "cancelled", "failed"] },
    scheduledFor: { type: "string", format: "date-time" },
    sentAt: { type: ["string", "null"], format: "date-time" },
    cancelledAt: { type: ["string", "null"], format: "date-time" },
    failedAt: { type: ["string", "null"], format: "date-time" },
    hoursBefore: { type: "integer" },
    customerPhone: { type: "string" },
    message: { type: "string" },
    externalMessageId: { type: ["string", "null"] },
    lastError: { type: ["string", "null"] },
  },
} as const;

const processDueNotificationsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100 },
  },
} as const;

const processDueNotificationsResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["processedCount", "sentCount", "failedCount", "items"],
  properties: {
    processedCount: { type: "integer" },
    sentCount: { type: "integer" },
    failedCount: { type: "integer" },
    items: {
      type: "array",
      items: bookingNotificationSchema,
    },
  },
} as const;

const buildListResponseSchema = (itemSchema: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: itemSchema,
    },
  },
});

const paginationQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100 },
    page: { type: "integer", minimum: 1 },
  },
} as const;

const bookingListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: "string" },
    from: { type: "string" },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    page: { type: "integer", minimum: 1 },
    to: { type: "string" },
  },
} as const;

const providerServiceListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100 },
    page: { type: "integer", minimum: 1 },
    providerId: { type: "string" },
  },
} as const;

const buildPaginatedListResponseSchema = (itemSchema: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: ["items", "page", "limit", "total", "totalPages"],
  properties: {
    items: {
      type: "array",
      items: itemSchema,
    },
    limit: { type: "integer" },
    page: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
});

const protectedRouteSchemaBase = {
  headers: protectedHeadersSchema,
  security: [{ bearerAuth: [] }],
  response: {
    401: errorResponseSchema,
    403: errorResponseSchema,
    500: errorResponseSchema,
  },
} as const;

export const healthRouteSchema = {
  tags: ["Health"],
  summary: "Health check",
  description: "Checks if the API process is running.",
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["status"],
      properties: {
        status: { type: "string", const: "ok" },
      },
    },
  },
} satisfies FastifySchema;

export const signInRouteSchema = {
  tags: ["Auth"],
  summary: "Sign in",
  description: "Authenticates a user and returns access and refresh tokens.",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["email", "password"],
    properties: {
      email: {
        type: "string",
        format: "email",
        examples: ["admin@organization.test"],
      },
      password: {
        type: "string",
        minLength: 8,
        examples: ["password123"],
      },
    },
  },
  response: {
    200: authSessionSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema;

export const refreshRouteSchema = {
  tags: ["Auth"],
  summary: "Refresh session",
  description: "Rotates the refresh token and returns a fresh access token pair.",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["refreshToken"],
    properties: {
      refreshToken: {
        type: "string",
        examples: ["{{refreshToken}}"],
      },
    },
  },
  response: {
    200: authSessionSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema;

export const authSignUpRouteSchema = {
  tags: ["Auth"],
  summary: "Sign up",
  description: "Creates a organization tenant and the initial administrator account.",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["fullName", "email", "phone", "password", "organization"],
    properties: {
      fullName: { type: "string", minLength: 3, maxLength: 120 },
      email: { type: "string", format: "email" },
      phone: { type: "string", minLength: 10, maxLength: 30 },
      password: { type: "string", minLength: 8, maxLength: 120 },
      organization: organizationWriteSchema,
    },
  },
  response: {
    201: authSessionSchema,
    409: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema;

export const authMeRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Auth"],
  summary: "Current account",
  description: "Returns the authenticated account and organization context.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: meResponseSchema,
  },
} satisfies FastifySchema;

export const authUpdateAccountRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Auth"],
  summary: "Update account",
  description: "Updates the authenticated account profile.",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["fullName", "email", "phone"],
    properties: {
      fullName: { type: "string", minLength: 3, maxLength: 120 },
      email: { type: "string", format: "email" },
      phone: { type: "string", minLength: 10, maxLength: 30 },
    },
  },
  response: {
    ...protectedRouteSchemaBase.response,
    200: meResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const authUpdatePasswordRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Auth"],
  summary: "Update password",
  description: "Changes the authenticated account password and revokes the current refresh session.",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["currentPassword", "newPassword"],
    properties: {
      currentPassword: { type: "string", minLength: 8, maxLength: 120 },
      newPassword: { type: "string", minLength: 8, maxLength: 120 },
    },
  },
  response: {
    ...protectedRouteSchemaBase.response,
    200: {
      type: "object",
      additionalProperties: false,
      required: ["message"],
      properties: {
        message: { type: "string" },
      },
    },
  },
} satisfies FastifySchema;

export const forgotPasswordRouteSchema = {
  tags: ["Auth"],
  summary: "Forgot password",
  description: "Starts a password recovery flow with a generic response.",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["email"],
    properties: {
      email: {
        type: "string",
        format: "email",
        examples: ["admin@organization.test"],
      },
    },
  },
  response: {
    202: {
      type: "object",
      additionalProperties: false,
      required: ["message"],
      properties: {
        message: { type: "string" },
      },
    },
    429: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema;

export const organizationsListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Organizations"],
  summary: "List organizations",
  description: "Lists organizations available to administrator and reception users.",
  querystring: paginationQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(organizationSchema),
  },
} satisfies FastifySchema;

export const organizationsCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Organizations"],
  summary: "Create organization",
  body: organizationWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: organizationSchema,
  },
} satisfies FastifySchema;

export const organizationsUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Organizations"],
  summary: "Update organization",
  body: organizationWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: organizationSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const providersListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Providers"],
  summary: "List providers",
  description: "Lists providers for the authenticated tenant.",
  querystring: paginationQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(providerSchema),
  },
} satisfies FastifySchema;

export const providersCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Providers"],
  summary: "Create provider",
  body: providerWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: providerSchema,
  },
} satisfies FastifySchema;

export const providersUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Providers"],
  summary: "Update provider",
  body: providerWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: providerSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const providersStatusRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Providers"],
  summary: "Update provider status",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["isActive"],
    properties: {
      isActive: { type: "boolean" },
    },
  },
  response: {
    ...protectedRouteSchemaBase.response,
    200: providerSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const providerAvailabilityListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Providers"],
  summary: "List provider availability",
  response: {
    ...protectedRouteSchemaBase.response,
    200: {
      type: "array",
      items: providerAvailabilitySchema,
    },
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const providerAvailabilityReplaceRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Providers"],
  summary: "Replace provider availability",
  body: {
    type: "array",
    items: providerAvailabilityWriteSchema,
  },
  response: {
    ...protectedRouteSchemaBase.response,
    200: {
      type: "array",
      items: providerAvailabilitySchema,
    },
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const providerServicesListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Provider services"],
  summary: "List service offerings",
  description: "Lists booking services offered by providers in the authenticated tenant.",
  querystring: providerServiceListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(providerServiceSchema),
  },
} satisfies FastifySchema;

export const providerServicesCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Provider services"],
  summary: "Create provider service",
  body: providerServiceWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: providerServiceSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const providerServicesUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Provider services"],
  summary: "Update provider service",
  body: providerServiceWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: providerServiceSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const providerServicesStatusRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Provider services"],
  summary: "Update provider service status",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["isActive"],
    properties: {
      isActive: { type: "boolean" },
    },
  },
  response: {
    ...protectedRouteSchemaBase.response,
    200: providerServiceSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const customersListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Customers"],
  summary: "List customers",
  description: "Lists customers for the authenticated tenant.",
  querystring: paginationQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(customerSchema),
  },
} satisfies FastifySchema;

export const customersCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Customers"],
  summary: "Create customer",
  body: customerWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: customerSchema,
  },
} satisfies FastifySchema;

export const customersUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Customers"],
  summary: "Update customer",
  body: customerWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: customerSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const customersStatusRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Customers"],
  summary: "Update customer status",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["isActive"],
    properties: {
      isActive: { type: "boolean" },
    },
  },
  response: {
    ...protectedRouteSchemaBase.response,
    200: customerSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const bookingsListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Bookings"],
  summary: "List bookings",
  description: "Lists bookings with customer and provider names.",
  querystring: bookingListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(bookingSchema),
  },
} satisfies FastifySchema;

export const bookingsCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Bookings"],
  summary: "Create booking",
  body: bookingWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: bookingSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const bookingsRescheduleRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Bookings"],
  summary: "Reschedule booking",
  body: bookingWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: bookingSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const bookingActionRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Bookings"],
  summary: "Update booking status",
  body: bookingActionSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: bookingSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const bookingsDailyScheduleRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Bookings"],
  summary: "Daily schedule",
  querystring: bookingListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: bookingScheduleSchema,
  },
} satisfies FastifySchema;

export const bookingsWeeklyScheduleRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Bookings"],
  summary: "Weekly schedule",
  querystring: bookingListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: bookingScheduleSchema,
  },
} satisfies FastifySchema;

export const notificationsChannelsRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Notifications"],
  summary: "List notification channels",
  description: "Lists notification channels enabled for the MVP.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: stringListResponseSchema,
  },
} satisfies FastifySchema;

export const notificationsWhatsAppSettingsGetRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Notifications"],
  summary: "Get WhatsApp reminder settings",
  description: "Returns the WhatsApp reminder configuration for the current organization.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappReminderSettingsSchema,
  },
} satisfies FastifySchema;

export const notificationsWhatsAppSettingsUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Notifications"],
  summary: "Update WhatsApp reminder settings",
  description: "Configures how many WhatsApp reminders should be scheduled before each booking.",
  body: whatsappReminderSettingsWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappReminderSettingsSchema,
    400: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const notificationsProcessDueWhatsAppRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Notifications"],
  summary: "Process due WhatsApp reminders",
  description: "Sends pending WhatsApp reminders whose scheduled time has already been reached.",
  body: processDueNotificationsSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: processDueNotificationsResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const integrationsListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Integrations"],
  summary: "List integrations",
  description: "Lists the integrations currently active in the backend.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildListResponseSchema(integrationSummarySchema),
  },
} satisfies FastifySchema;

export const whatsappStatusRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Integrations"],
  summary: "WhatsApp connection status",
  description: "Gets the current Evolution API instance connection state.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappStatusSchema,
    502: errorResponseSchema,
    503: errorResponseSchema,
  },
} satisfies FastifySchema;

export const whatsappConnectRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Integrations"],
  summary: "WhatsApp connect code",
  description: "Requests a QR or pairing code from the Evolution API instance.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappConnectSchema,
    502: errorResponseSchema,
    503: errorResponseSchema,
  },
} satisfies FastifySchema;

export const whatsappSendTextRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Integrations"],
  summary: "Send WhatsApp text",
  description: "Sends a plain text WhatsApp message via Evolution API.",
  body: whatsappSendTextSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: whatsappSendTextResponseSchema,
    502: errorResponseSchema,
    503: errorResponseSchema,
  },
} satisfies FastifySchema;

export const whatsappSessionStartRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Integrations"],
  summary: "Start WhatsApp session",
  description: "Creates or reuses the organization instance and requests a connection code for the informed phone number.",
  body: whatsappSessionRequestSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappSessionResponseSchema,
    502: errorResponseSchema,
    503: errorResponseSchema,
  },
} satisfies FastifySchema;

export const whatsappRegenerateCodeRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Integrations"],
  summary: "Regenerate WhatsApp code",
  description: "Restarts the organization instance and requests a fresh connection code for the informed phone number.",
  body: whatsappSessionRequestSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappSessionResponseSchema,
    502: errorResponseSchema,
    503: errorResponseSchema,
  },
} satisfies FastifySchema;

export const whatsappDisconnectRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Integrations"],
  summary: "Disconnect WhatsApp",
  description: "Disconnects the WhatsApp provider session without exposing internal instance identifiers.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappDisconnectResponseSchema,
    502: errorResponseSchema,
    503: errorResponseSchema,
  },
} satisfies FastifySchema;

export const reportsCatalogRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Reports"],
  summary: "List report catalog",
  description: "Lists report identifiers available in the MVP.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: stringListResponseSchema,
  },
} satisfies FastifySchema;

export const noShowOverviewRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Reports"],
  summary: "No-show overview",
  response: {
    ...protectedRouteSchemaBase.response,
    200: noShowOverviewSchema,
  },
} satisfies FastifySchema;

export const auditEventsRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Audit"],
  summary: "List audit events",
  description: "Lists audit events for administrator users.",
  querystring: paginationQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(auditEventSchema),
  },
} satisfies FastifySchema;

export const publicBookingPageRouteSchema = {
  tags: ["Public bookings"],
  summary: "Get public booking page",
  response: {
    200: publicBookingPageSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema;

export const publicBookingAvailabilityRouteSchema = {
  tags: ["Public bookings"],
  summary: "List public availability slots",
  querystring: publicBookingAvailabilityQuerySchema,
  response: {
    200: publicBookingAvailabilityResponseSchema,
    404: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema;

export const publicBookingCreateRouteSchema = {
  tags: ["Public bookings"],
  summary: "Create public booking",
  body: publicBookingCreateSchema,
  response: {
    201: bookingSchema,
    400: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
    500: errorResponseSchema,
  },
} satisfies FastifySchema;
