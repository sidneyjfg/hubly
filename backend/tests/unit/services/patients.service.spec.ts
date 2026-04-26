import { describe, expect, it } from "vitest";

import { CustomersService } from "../../../src/services/customers.service";
import type { CustomerWriteInput } from "../../../src/types/customer";
import { AppError } from "../../../src/utils/app-error";

const authUser = {
  id: "usr_admin_001",
  organizationId: "cln_main_001",
  role: "administrator" as const,
  sessionId: "sess_001",
};

describe("CustomersService", () => {
  it("creates a customer in the authenticated organization", async () => {
    const service = new CustomersService({
      async create(organizationId: string, input: CustomerWriteInput) {
        return {
          id: "pat_100",
          organizationId,
          fullName: input.fullName,
          email: input.email ?? null,
          phone: input.phone,
        };
      },
    } as never);

    const result = await service.create(authUser, {
      fullName: "Marcos Paulo",
      email: "marcos@customer.test",
      phone: "+5511955555555",
    });

    expect(result.organizationId).toBe("cln_main_001");
    expect(result.email).toBe("marcos@customer.test");
  });

  it("updates an existing customer", async () => {
    const service = new CustomersService({
      async updateInOrganization(organizationId: string, id: string, input: CustomerWriteInput) {
        return {
          id,
          organizationId,
          fullName: input.fullName,
          email: input.email ?? null,
          phone: input.phone,
        };
      },
    } as never);

    const result = await service.update(authUser, "pat_001", {
      fullName: "Marcos Paulo Lima",
      email: "marcos.lima@customer.test",
      phone: "+5511944444444",
    });

    expect(result.fullName).toBe("Marcos Paulo Lima");
  });

  it("throws when trying to update a missing customer", async () => {
    const service = new CustomersService({
      async updateInOrganization() {
        return null;
      },
    } as never);

    await expect(
      service.update(authUser, "pat_missing", {
        fullName: "Marcos Paulo",
        email: "marcos@customer.test",
        phone: "+5511955555555",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
