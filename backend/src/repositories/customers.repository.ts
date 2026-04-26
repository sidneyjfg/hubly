import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { CustomerEntity } from "../database/entities";
import type { Customer, CustomerWriteInput } from "../types/customer";
import { buildPaginatedResult, getPaginationOffset, type PaginatedResult, type Pagination } from "../utils/pagination";

export class CustomersRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(CustomerEntity);
  }

  private mapCustomer(customer: CustomerEntity): Customer {
    return {
      id: customer.id,
      organizationId: customer.organizationId,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      isActive: customer.isActive,
    };
  }

  public async findAll(organizationId: string, pagination: Pagination): Promise<PaginatedResult<Customer>> {
    const [customers, total] = await this.getRepository().findAndCount({
      where: {
        organizationId,
      },
      order: {
        fullName: "ASC",
      },
      skip: getPaginationOffset(pagination),
      take: pagination.limit,
    });

    return buildPaginatedResult(customers.map((customer) => this.mapCustomer(customer)), total, pagination);
  }

  public async findByIdInOrganization(organizationId: string, id: string, manager?: EntityManager): Promise<Customer | null> {
    const customer = await this.getRepository(manager).findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!customer) {
      return null;
    }

    return this.mapCustomer(customer);
  }

  public async create(organizationId: string, input: CustomerWriteInput, manager?: EntityManager): Promise<Customer> {
    const customer = await this.getRepository(manager).save({
      id: randomUUID(),
      organizationId,
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone,
    });

    return this.mapCustomer(customer);
  }

  public async findByPhoneOrEmailInOrganization(
    organizationId: string,
    input: { email?: string | null; phone: string },
    manager?: EntityManager,
  ): Promise<Customer | null> {
    const repository = this.getRepository(manager);

    const customer = await repository
      .createQueryBuilder("customer")
      .where("customer.organizationId = :organizationId", { organizationId })
      .andWhere("(customer.phone = :phone OR customer.email = :email)", {
        phone: input.phone,
        email: input.email ?? null,
      })
      .orderBy("customer.fullName", "ASC")
      .getOne();

    return customer ? this.mapCustomer(customer) : null;
  }

  public async updateInOrganization(organizationId: string, id: string, input: CustomerWriteInput): Promise<Customer | null> {
    const repository = this.getRepository();
    const customer = await repository.findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!customer) {
      return null;
    }

    customer.fullName = input.fullName;
    customer.email = input.email ?? null;
    customer.phone = input.phone;

    const savedCustomer = await repository.save(customer);

    return this.mapCustomer(savedCustomer);
  }

  public async setActiveInOrganization(organizationId: string, id: string, isActive: boolean): Promise<Customer | null> {
    const repository = this.getRepository();
    const customer = await repository.findOne({
      where: {
        id,
        organizationId,
      },
    });

    if (!customer) {
      return null;
    }

    customer.isActive = isActive;
    const savedCustomer = await repository.save(customer);

    return this.mapCustomer(savedCustomer);
  }
}
