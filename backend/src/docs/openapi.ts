export const buildOpenApiDocument = () => {
  return {
    openapi: "3.1.0",
    info: {
      title: "Clinity API",
      version: "0.1.0",
      description: [
        "API do MVP de agendamento para clínicas.",
        "",
        "Downloads úteis para teste local:",
        "- Collection Postman: `/docs/postman/collection.json`",
        "- Environment Postman: `/docs/postman/environment.json`",
        "",
        "Credenciais seed locais:",
        "- `admin@clinic.test` / `password123`",
      ].join("\n"),
    },
    servers: [
      {
        url: "http://localhost:3333",
        description: "Local development",
      },
    ],
    tags: [
      { name: "Health" },
      { name: "Auth" },
      { name: "Clinics" },
      { name: "Professionals" },
      { name: "Patients" },
      { name: "Appointments" },
      { name: "Notifications" },
      { name: "Integrations" },
      { name: "Reports" },
      { name: "Audit" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http" as const,
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token returned by /v1/auth/sign-in.",
        },
      },
    },
  };
};
