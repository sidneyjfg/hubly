import { z } from "zod";

import { CustomersRepository } from "../repositories/customers.repository";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { Customer } from "../types/customer";
import type { CustomerWriteInput } from "../types/customer";
import { AppError } from "../utils/app-error";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";

const customerWriteSchema = z.object({
  fullName: z.string().min(3).max(120),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(8).max(30),
});

export class CustomersService {
  public constructor(private readonly customersRepository: CustomersRepository) {}

  public async list(user: AuthenticatedRequestUser, paginationInput: PaginationInput = {}): Promise<PaginatedResult<Customer>> {
    return this.customersRepository.findAll(user.organizationId, parsePagination(paginationInput));
  }

  public async create(user: AuthenticatedRequestUser, input: CustomerWriteInput): Promise<Customer> {
    const data = customerWriteSchema.parse({
      ...input,
      email: input.email ?? null,
    });
    return this.customersRepository.create(user.organizationId, {
      fullName: data.fullName,
      phone: data.phone,
      ...(data.email === undefined ? {} : { email: data.email }),
    });
  }

  public async update(user: AuthenticatedRequestUser, id: string, input: CustomerWriteInput): Promise<Customer> {
    const data = customerWriteSchema.parse({
      ...input,
      email: input.email ?? null,
    });

    const customer = await this.customersRepository.updateInOrganization(user.organizationId, id, {
      fullName: data.fullName,
      phone: data.phone,
      ...(data.email === undefined ? {} : { email: data.email }),
    });
    if (!customer) {
      throw new AppError("customers.not_found", "Customer not found.", 404);
    }

    return customer;
  }

  public async setStatus(user: AuthenticatedRequestUser, id: string, isActive: boolean): Promise<Customer> {
    const customer = await this.customersRepository.setActiveInOrganization(user.organizationId, id, isActive);
    if (!customer) {
      throw new AppError("customers.not_found", "Paciente não encontrado.", 404);
    }

    return customer;
  }
}
