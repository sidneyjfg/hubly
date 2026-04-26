const loginEventScript = [
  "const data = pm.response.json();",
  "",
  "pm.collectionVariables.set('accessToken', data.accessToken);",
  "pm.collectionVariables.set('refreshToken', data.refreshToken);",
  "pm.collectionVariables.set('organizationId', data.organizationId);",
  "",
  "if (pm.environment) {",
  "  pm.environment.set('accessToken', data.accessToken);",
  "  pm.environment.set('refreshToken', data.refreshToken);",
  "  pm.environment.set('organizationId', data.organizationId);",
  "}",
].join("\n");

const refreshEventScript = [
  "const data = pm.response.json();",
  "",
  "pm.collectionVariables.set('accessToken', data.accessToken);",
  "pm.collectionVariables.set('refreshToken', data.refreshToken);",
  "pm.collectionVariables.set('organizationId', data.organizationId);",
  "",
  "if (pm.environment) {",
  "  pm.environment.set('accessToken', data.accessToken);",
  "  pm.environment.set('refreshToken', data.refreshToken);",
  "  pm.environment.set('organizationId', data.organizationId);",
  "}",
].join("\n");

type RequestDefinition = {
  name: string;
  method: "GET" | "POST" | "PATCH";
  path: string;
  description: string;
  requiresAuth?: boolean;
  body?: Record<string, string | boolean | null>;
  testScript?: string;
};

const requestDefinitions: RequestDefinition[] = [
  {
    name: "Health",
    method: "GET",
    path: "/v1/health",
    description: "Checks if the API process is running.",
  },
  {
    name: "Sign In",
    method: "POST",
    path: "/v1/auth/sign-in",
    description: "Authenticates with seeded local credentials and stores token variables automatically.",
    body: {
      email: "{{email}}",
      password: "{{password}}",
    },
    testScript: loginEventScript,
  },
  {
    name: "Refresh",
    method: "POST",
    path: "/v1/auth/refresh",
    description: "Rotates tokens using the refresh token stored after login.",
    body: {
      refreshToken: "{{refreshToken}}",
    },
    testScript: refreshEventScript,
  },
  {
    name: "Organizations",
    method: "GET",
    path: "/v1/organizations",
    description: "Lists organizations. Requires administrator or reception role.",
    requiresAuth: true,
  },
  {
    name: "Providers",
    method: "GET",
    path: "/v1/providers",
    description: "Lists providers for the authenticated tenant.",
    requiresAuth: true,
  },
  {
    name: "Create Provider",
    method: "POST",
    path: "/v1/providers",
    description: "Creates a provider in the authenticated tenant.",
    requiresAuth: true,
    body: {
      fullName: "Dra. Julia Ribeiro",
      specialty: "Dermatologia",
    },
  },
  {
    name: "Update Provider Status",
    method: "PATCH",
    path: "/v1/providers/pro_001/status",
    description: "Activates or inactivates a provider.",
    requiresAuth: true,
    body: {
      isActive: false,
    },
  },
  {
    name: "Customers",
    method: "GET",
    path: "/v1/customers",
    description: "Lists customers for the authenticated tenant.",
    requiresAuth: true,
  },
  {
    name: "Create Customer",
    method: "POST",
    path: "/v1/customers",
    description: "Creates a customer in the authenticated tenant.",
    requiresAuth: true,
    body: {
      fullName: "Marcos Paulo",
      email: "marcos@customer.test",
      phone: "+5511955555555",
    },
  },
  {
    name: "Bookings",
    method: "GET",
    path: "/v1/bookings",
    description: "Lists bookings for the authenticated tenant.",
    requiresAuth: true,
  },
  {
    name: "Create Booking",
    method: "POST",
    path: "/v1/bookings",
    description: "Creates a new booking with conflict validation for the provider.",
    requiresAuth: true,
    body: {
      customerId: "pat_001",
      providerId: "pro_001",
      startsAt: "2026-04-21T12:00:00.000Z",
      endsAt: "2026-04-21T12:30:00.000Z",
      notes: "Primeira consulta",
    },
  },
  {
    name: "Cancel Booking",
    method: "PATCH",
    path: "/v1/bookings/apt_001/cancel",
    description: "Cancels an booking.",
    requiresAuth: true,
    body: {
      notes: "Paciente cancelou",
    },
  },
  {
    name: "Reschedule Booking",
    method: "PATCH",
    path: "/v1/bookings/apt_001/reschedule",
    description: "Reschedules an booking with conflict validation.",
    requiresAuth: true,
    body: {
      customerId: "pat_001",
      providerId: "pro_001",
      startsAt: "2026-04-21T13:00:00.000Z",
      endsAt: "2026-04-21T13:30:00.000Z",
      notes: "Horario reagendado",
    },
  },
  {
    name: "Mark Booking Attended",
    method: "PATCH",
    path: "/v1/bookings/apt_001/attendance",
    description: "Marks an booking as attended.",
    requiresAuth: true,
    body: {
      notes: "Paciente compareceu",
    },
  },
  {
    name: "Mark Booking Missed",
    method: "PATCH",
    path: "/v1/bookings/apt_001/missed",
    description: "Marks an booking as missed.",
    requiresAuth: true,
    body: {
      notes: "No-show",
    },
  },
  {
    name: "Daily Schedule",
    method: "GET",
    path: "/v1/bookings/daily-schedule?date=2026-04-20",
    description: "Returns the daily schedule for a given date.",
    requiresAuth: true,
  },
  {
    name: "Weekly Schedule",
    method: "GET",
    path: "/v1/bookings/weekly-schedule?date=2026-04-20",
    description: "Returns the weekly schedule for a given date.",
    requiresAuth: true,
  },
  {
    name: "Notification Channels",
    method: "GET",
    path: "/v1/notifications/channels",
    description: "Lists notification channels enabled in the MVP.",
    requiresAuth: true,
  },
  {
    name: "Integrations",
    method: "GET",
    path: "/v1/integrations",
    description: "Lists the integrations currently in scope.",
    requiresAuth: true,
  },
  {
    name: "Start WhatsApp Session",
    method: "POST",
    path: "/v1/integrations/whatsapp/session",
    description: "Creates or reuses the organization WhatsApp instance and requests a connection code for the informed phone.",
    requiresAuth: true,
    body: {
      phoneNumber: "5531995734976",
    },
  },
  {
    name: "Regenerate WhatsApp Code",
    method: "POST",
    path: "/v1/integrations/whatsapp/session/regenerate-code",
    description: "Restarts the organization WhatsApp instance and requests a fresh connection code.",
    requiresAuth: true,
    body: {
      phoneNumber: "5531995734976",
    },
  },
  {
    name: "Reports Catalog",
    method: "GET",
    path: "/v1/reports/catalog",
    description: "Lists report identifiers available in the MVP.",
    requiresAuth: true,
  },
  {
    name: "No-show Overview",
    method: "GET",
    path: "/v1/reports/no-show-overview?from=2026-04-18&to=2026-04-20",
    description: "Returns basic no-show indicators for the selected period.",
    requiresAuth: true,
  },
  {
    name: "Audit Events",
    method: "GET",
    path: "/v1/audit/events",
    description: "Lists audit events. Requires administrator role.",
    requiresAuth: true,
  },
];

const buildRequest = (definition: RequestDefinition) => {
  const [rawPathname, queryString] = definition.path.split("?");
  const pathname = rawPathname ?? definition.path;
  const headers = definition.requiresAuth
    ? [
        {
          key: "Authorization",
          value: "Bearer {{accessToken}}",
          type: "text",
        },
        {
          key: "x-organization-id",
          value: "{{organizationId}}",
          type: "text",
        },
      ]
    : [];

  const request = {
    method: definition.method,
    header: headers,
    description: definition.description,
    url: {
      raw: "{{baseUrl}}" + definition.path,
      host: ["{{baseUrl}}"],
      path: pathname.split("/").filter(Boolean),
      ...(queryString
        ? {
            query: queryString.split("&").map((entry) => {
              const [key, value] = entry.split("=");
              return {
                key,
                value: value ?? "",
              };
            }),
          }
        : {}),
    },
  } as {
    method: string;
    header: Array<{ key: string; value: string; type: string }>;
    description: string;
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string }>;
    };
    body?: {
      mode: "raw";
      raw: string;
      options: {
        raw: {
          language: "json";
        };
      };
    };
  };

  if (definition.body) {
    request.header = [
      ...request.header,
      {
        key: "Content-Type",
        value: "application/json",
        type: "text",
      },
    ];
    request.body = {
      mode: "raw",
      raw: JSON.stringify(definition.body, null, 2),
      options: {
        raw: {
          language: "json",
        },
      },
    };
  }

  const events = definition.testScript
    ? [
        {
          listen: "test",
          script: {
            type: "text/javascript",
            exec: definition.testScript.split("\n"),
          },
        },
      ]
    : [];

  return {
    name: definition.name,
    request,
    event: events,
  };
};

export const buildPostmanCollection = () => ({
  info: {
    name: "Hubly Local API",
    description:
      "Collection for local API testing. Run Sign In first to populate accessToken, refreshToken and organizationId automatically.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:3333" },
    { key: "email", value: "admin@organization.test" },
    { key: "password", value: "password123" },
    { key: "accessToken", value: "" },
    { key: "refreshToken", value: "" },
    { key: "organizationId", value: "" },
  ],
  item: [
    {
      name: "Public",
      item: requestDefinitions
        .filter((definition) => !definition.requiresAuth)
        .map(buildRequest),
    },
    {
      name: "Protected",
      item: requestDefinitions
        .filter((definition) => definition.requiresAuth)
        .map(buildRequest),
    },
  ],
});

export const buildPostmanEnvironment = () => ({
  name: "Hubly Local",
  values: [
    {
      key: "baseUrl",
      value: "http://localhost:3333",
      type: "default",
      enabled: true,
    },
    {
      key: "email",
      value: "admin@organization.test",
      type: "default",
      enabled: true,
    },
    {
      key: "password",
      value: "password123",
      type: "secret",
      enabled: true,
    },
    {
      key: "accessToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "refreshToken",
      value: "",
      type: "secret",
      enabled: true,
    },
    {
      key: "organizationId",
      value: "",
      type: "default",
      enabled: true,
    },
  ],
  _postman_variable_scope: "environment",
  _postman_exported_at: "2026-04-21T00:00:00.000Z",
  _postman_exported_using: "Codex",
});
