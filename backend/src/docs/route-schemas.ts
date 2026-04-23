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
    "x-clinic-id": {
      type: "string",
      description: "Optional tenant header. When provided it must match the clinicId from the token.",
      examples: ["{{clinicId}}"],
    },
  },
} as const;

const roleSchema = {
  type: "string",
  enum: ["administrator", "reception", "professional"],
} as const;

const authSessionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["accessToken", "refreshToken", "sessionId", "clinicId", "actorId", "role"],
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
    sessionId: { type: "string" },
    clinicId: { type: "string" },
    actorId: { type: "string" },
    role: roleSchema,
  },
} as const;

const userSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "clinicId", "fullName", "email", "phone", "role", "isActive", "createdAt"],
  properties: {
    id: { type: "string" },
    clinicId: { type: "string" },
    fullName: { type: "string" },
    email: { type: "string", format: "email" },
    phone: { type: "string" },
    role: roleSchema,
    isActive: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

const clinicSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "legalName", "tradeName", "timezone"],
  properties: {
    id: { type: "string" },
    legalName: { type: "string" },
    tradeName: { type: "string" },
    timezone: { type: "string" },
  },
} as const;

const meResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["user", "clinic"],
  properties: {
    user: userSchema,
    clinic: clinicSchema,
  },
} as const;

const clinicWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["legalName", "tradeName", "timezone"],
  properties: {
    legalName: { type: "string" },
    tradeName: { type: "string" },
    timezone: { type: "string" },
  },
} as const;

const professionalSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "clinicId", "fullName", "specialty", "isActive"],
  properties: {
    id: { type: "string" },
    clinicId: { type: "string" },
    fullName: { type: "string" },
    specialty: { type: "string" },
    isActive: { type: "boolean" },
  },
} as const;

const professionalServiceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "clinicId", "professionalId", "name", "durationMinutes", "isActive"],
  properties: {
    id: { type: "string" },
    clinicId: { type: "string" },
    professionalId: { type: "string" },
    professionalName: { type: "string" },
    name: { type: "string" },
    durationMinutes: { type: "integer" },
    priceCents: { type: ["integer", "null"] },
    isActive: { type: "boolean" },
  },
} as const;

const professionalServiceWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["professionalId", "name", "durationMinutes"],
  properties: {
    professionalId: { type: "string" },
    name: { type: "string" },
    durationMinutes: { type: "integer", minimum: 5, maximum: 720 },
    priceCents: { type: ["integer", "null"], minimum: 0 },
    isActive: { type: "boolean" },
  },
} as const;

const professionalWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fullName", "specialty"],
  properties: {
    fullName: { type: "string" },
    specialty: { type: "string" },
    isActive: { type: "boolean" },
  },
} as const;

const patientSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "clinicId", "fullName", "phone", "isActive"],
  properties: {
    id: { type: "string" },
    clinicId: { type: "string" },
    fullName: { type: "string" },
    email: { type: ["string", "null"] },
    phone: { type: "string" },
    isActive: { type: "boolean" },
  },
} as const;

const patientWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["fullName", "phone"],
  properties: {
    fullName: { type: "string" },
    email: { type: ["string", "null"], format: "email" },
    phone: { type: "string" },
  },
} as const;

const appointmentSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "clinicId",
    "patientId",
    "professionalId",
    "status",
    "startsAt",
    "endsAt",
  ],
  properties: {
    id: { type: "string" },
    clinicId: { type: "string" },
    patientId: { type: "string" },
    professionalId: { type: "string" },
    serviceId: { type: ["string", "null"] },
    patientName: { type: "string" },
    professionalName: { type: "string" },
    serviceName: { type: ["string", "null"] },
    status: {
      type: "string",
      enum: ["scheduled", "confirmed", "cancelled", "rescheduled", "attended", "missed"],
    },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    notes: { type: ["string", "null"] },
  },
} as const;

const appointmentWriteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["patientId", "professionalId", "startsAt", "endsAt"],
  properties: {
    patientId: { type: "string" },
    professionalId: { type: "string" },
    serviceId: { type: ["string", "null"] },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    notes: { type: ["string", "null"] },
  },
} as const;

const appointmentActionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    notes: { type: ["string", "null"] },
  },
} as const;

const appointmentScheduleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["referenceDate", "startDate", "endDate", "items", "page", "limit", "total", "totalPages"],
  properties: {
    referenceDate: { type: "string", format: "date-time" },
    startDate: { type: "string", format: "date-time" },
    endDate: { type: "string", format: "date-time" },
    items: {
      type: "array",
      items: appointmentSchema,
    },
    limit: { type: "integer" },
    page: { type: "integer" },
    total: { type: "integer" },
    totalPages: { type: "integer" },
  },
} as const;

const noShowOverviewSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "clinicId",
    "periodStart",
    "periodEnd",
    "totalAppointments",
    "attendedAppointments",
    "missedAppointments",
    "noShowRate",
  ],
  properties: {
    clinicId: { type: "string" },
    periodStart: { type: "string", format: "date-time" },
    periodEnd: { type: "string", format: "date-time" },
    totalAppointments: { type: "number" },
    attendedAppointments: { type: "number" },
    missedAppointments: { type: "number" },
    noShowRate: { type: "number" },
  },
} as const;

const auditEventSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "clinicId", "actorId", "action", "targetType", "targetId", "occurredAt"],
  properties: {
    id: { type: "string" },
    clinicId: { type: "string" },
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
  required: ["clinicId", "channel", "isEnabled", "reminders"],
  properties: {
    clinicId: { type: "string" },
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

const appointmentNotificationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "clinicId",
    "appointmentId",
    "channel",
    "status",
    "scheduledFor",
    "hoursBefore",
    "patientPhone",
    "message",
  ],
  properties: {
    id: { type: "string" },
    clinicId: { type: "string" },
    appointmentId: { type: "string" },
    channel: { type: "string", const: "whatsapp" },
    status: { type: "string", enum: ["pending", "processing", "sent", "cancelled", "failed"] },
    scheduledFor: { type: "string", format: "date-time" },
    sentAt: { type: ["string", "null"], format: "date-time" },
    cancelledAt: { type: ["string", "null"], format: "date-time" },
    failedAt: { type: ["string", "null"], format: "date-time" },
    hoursBefore: { type: "integer" },
    patientPhone: { type: "string" },
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
      items: appointmentNotificationSchema,
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

const appointmentListQuerySchema = {
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

const professionalServiceListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 100 },
    page: { type: "integer", minimum: 1 },
    professionalId: { type: "string" },
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
        examples: ["admin@clinic.test"],
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
  description: "Creates a clinic tenant and the initial administrator account.",
  body: {
    type: "object",
    additionalProperties: false,
    required: ["fullName", "email", "phone", "password", "clinic"],
    properties: {
      fullName: { type: "string", minLength: 3, maxLength: 120 },
      email: { type: "string", format: "email" },
      phone: { type: "string", minLength: 10, maxLength: 30 },
      password: { type: "string", minLength: 8, maxLength: 120 },
      clinic: clinicWriteSchema,
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
  description: "Returns the authenticated account and clinic context.",
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
        examples: ["admin@clinic.test"],
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

export const clinicsListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Clinics"],
  summary: "List clinics",
  description: "Lists clinics available to administrator and reception users.",
  querystring: paginationQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(clinicSchema),
  },
} satisfies FastifySchema;

export const clinicsCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Clinics"],
  summary: "Create clinic",
  body: clinicWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: clinicSchema,
  },
} satisfies FastifySchema;

export const clinicsUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Clinics"],
  summary: "Update clinic",
  body: clinicWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: clinicSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const professionalsListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professionals"],
  summary: "List professionals",
  description: "Lists professionals for the authenticated tenant.",
  querystring: paginationQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(professionalSchema),
  },
} satisfies FastifySchema;

export const professionalsCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professionals"],
  summary: "Create professional",
  body: professionalWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: professionalSchema,
  },
} satisfies FastifySchema;

export const professionalsUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professionals"],
  summary: "Update professional",
  body: professionalWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: professionalSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const professionalsStatusRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professionals"],
  summary: "Update professional status",
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
    200: professionalSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const professionalServicesListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professional services"],
  summary: "List professional services",
  description: "Lists appointment services offered by professionals in the authenticated tenant.",
  querystring: professionalServiceListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(professionalServiceSchema),
  },
} satisfies FastifySchema;

export const professionalServicesCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professional services"],
  summary: "Create professional service",
  body: professionalServiceWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: professionalServiceSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const professionalServicesUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professional services"],
  summary: "Update professional service",
  body: professionalServiceWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: professionalServiceSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const professionalServicesStatusRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Professional services"],
  summary: "Update professional service status",
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
    200: professionalServiceSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const patientsListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Patients"],
  summary: "List patients",
  description: "Lists patients for the authenticated tenant.",
  querystring: paginationQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(patientSchema),
  },
} satisfies FastifySchema;

export const patientsCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Patients"],
  summary: "Create patient",
  body: patientWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: patientSchema,
  },
} satisfies FastifySchema;

export const patientsUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Patients"],
  summary: "Update patient",
  body: patientWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: patientSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const patientsStatusRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Patients"],
  summary: "Update patient status",
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
    200: patientSchema,
    404: errorResponseSchema,
  },
} satisfies FastifySchema;

export const appointmentsListRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Appointments"],
  summary: "List appointments",
  description: "Lists appointments with patient and professional names.",
  querystring: appointmentListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: buildPaginatedListResponseSchema(appointmentSchema),
  },
} satisfies FastifySchema;

export const appointmentsCreateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Appointments"],
  summary: "Create appointment",
  body: appointmentWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    201: appointmentSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const appointmentsRescheduleRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Appointments"],
  summary: "Reschedule appointment",
  body: appointmentWriteSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: appointmentSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const appointmentActionRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Appointments"],
  summary: "Update appointment status",
  body: appointmentActionSchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: appointmentSchema,
    404: errorResponseSchema,
    409: errorResponseSchema,
  },
} satisfies FastifySchema;

export const appointmentsDailyScheduleRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Appointments"],
  summary: "Daily schedule",
  querystring: appointmentListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: appointmentScheduleSchema,
  },
} satisfies FastifySchema;

export const appointmentsWeeklyScheduleRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Appointments"],
  summary: "Weekly schedule",
  querystring: appointmentListQuerySchema,
  response: {
    ...protectedRouteSchemaBase.response,
    200: appointmentScheduleSchema,
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
  description: "Returns the WhatsApp reminder configuration for the current clinic.",
  response: {
    ...protectedRouteSchemaBase.response,
    200: whatsappReminderSettingsSchema,
  },
} satisfies FastifySchema;

export const notificationsWhatsAppSettingsUpdateRouteSchema = {
  ...protectedRouteSchemaBase,
  tags: ["Notifications"],
  summary: "Update WhatsApp reminder settings",
  description: "Configures how many WhatsApp reminders should be scheduled before each appointment.",
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
  description: "Creates or reuses the clinic instance and requests a connection code for the informed phone number.",
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
  description: "Restarts the clinic instance and requests a fresh connection code for the informed phone number.",
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
