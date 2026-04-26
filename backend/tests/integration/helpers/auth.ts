import type { FastifyInstance } from "fastify";

export const signInAsAdmin = async (app: FastifyInstance) => {
  const response = await app.inject({
    method: "POST",
    url: "/v1/auth/sign-in",
    payload: {
      email: "admin@organization.test",
      password: "password123",
    },
  });

  const body = response.json();

  return {
    authorization: `Bearer ${body.accessToken as string}`,
    "x-organization-id": body.organizationId as string,
  };
};
