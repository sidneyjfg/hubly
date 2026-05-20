import { randomUUID } from "node:crypto";
import type { DataSource } from "typeorm";
import { z } from "zod";

import { AuditEventEntity, BillingPlanEntity, BookingEntity, CustomerEntity, OrganizationEntity, UserEntity } from "../database/entities";
import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import type { SystemAdminSession } from "../types/system-admin";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";
import { verifyPassword } from "../utils/password";
import { parsePagination, type PaginationInput } from "../utils/pagination";
import { createSystemAdminAccessToken } from "../utils/system-admin-tokens";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

const billingPlanSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(255).nullable().optional(),
  amountCents: z.number().int().min(100).max(1_000_000).optional(),
  currency: z.string().trim().length(3).optional(),
  interval: z.enum(["month", "year"]).optional(),
  stripeProductId: z.string().trim().max(120).nullable().optional(),
  stripePriceId: z.string().trim().max(120).nullable().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export class SystemAdminService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  public async signIn(input: { email: string; password: string }): Promise<SystemAdminSession> {
    const data = signInSchema.parse(input);

    if (!env.SYSTEM_ADMIN_PASSWORD_HASH) {
      throw new AppError("system_admin.not_configured", "System admin access is not configured.", 503);
    }

    const configuredEmail = env.SYSTEM_ADMIN_EMAIL.toLowerCase();
    const email = data.email.toLowerCase();
    if (email !== configuredEmail || !verifyPassword(data.password, env.SYSTEM_ADMIN_PASSWORD_HASH)) {
      throw new AppError("system_admin.invalid_credentials", "Invalid system admin credentials.", 401);
    }

    const sessionId = randomUUID();
    const actorId = "system-owner";

    return {
      accessToken: createSystemAdminAccessToken({
        sub: actorId,
        email,
        sessionId,
      }),
      sessionId,
      actorId,
      email,
      tokenType: "system_admin_access",
    };
  }

  public async listTenants(paginationInput: PaginationInput = {}) {
    return this.organizationsRepository.findAll(parsePagination(paginationInput));
  }

  public async listAuditEvents(input: PaginationInput & { organizationId?: string; action?: string } = {}) {
    return this.auditRepository.findAllForSystemAdmin(parsePagination(input), {
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.action ? { action: input.action } : {}),
    });
  }

  public async getOperationalSummary(): Promise<{
    tenants: number;
    users: number;
    customers: number;
    bookings: number;
    auditEvents: number;
  }> {
    const [tenants, users, customers, bookings, auditEvents] = await Promise.all([
      this.dataSource.getRepository(OrganizationEntity).count(),
      this.dataSource.getRepository(UserEntity).count(),
      this.dataSource.getRepository(CustomerEntity).count(),
      this.dataSource.getRepository(BookingEntity).count(),
      this.dataSource.getRepository(AuditEventEntity).count(),
    ]);

    return {
      tenants,
      users,
      customers,
      bookings,
      auditEvents,
    };
  }

  public async getSubscriptionReadiness() {
    const bookingsRepo = this.dataSource.getRepository(BookingEntity);

    // Operational adoption signals for the SaaS subscription model.
    const stats = await bookingsRepo
      .createQueryBuilder("booking")
      .select("booking.organizationId", "organizationId")
      .addSelect("org.tradeName", "organizationName")
      .addSelect("SUM(CASE WHEN booking.status = 'attended' THEN booking.discountedAmountCents ELSE 0 END)", "attendedRevenueCents")
      .addSelect("COUNT(CASE WHEN booking.status IN ('scheduled', 'confirmed', 'rescheduled') THEN 1 END)", "upcomingCount")
      .addSelect("COUNT(CASE WHEN booking.status = 'attended' THEN 1 END)", "attendedCount")
      .addSelect("COUNT(CASE WHEN booking.status = 'missed' THEN 1 END)", "missedCount")
      .addSelect("COUNT(CASE WHEN booking.status = 'scheduled' AND booking.startsAt < CURRENT_TIMESTAMP THEN 1 END)", "pendingStatusCount")
      .innerJoin("booking.organization", "org")
      .groupBy("booking.organizationId")
      .addGroupBy("org.tradeName")
      .getRawMany();

    return stats.map((row) => {
      const attendedCount = Number(row.attendedCount);
      const missedCount = Number(row.missedCount);
      const completedCount = attendedCount + missedCount;

      return {
        organizationId: row.organizationId,
        organizationName: row.organizationName,
        attendedRevenueCents: Number(row.attendedRevenueCents),
        upcomingCount: Number(row.upcomingCount),
        attendedCount,
        missedCount,
        pendingStatusCount: Number(row.pendingStatusCount),
        noShowRate: completedCount > 0 ? missedCount / completedCount : 0,
      };
    });
  }

  public async listBillingPlans(): Promise<{
    stripeBillingMode: "test" | "live";
    items: Array<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      amountCents: number;
      currency: string;
      interval: string;
      stripeMode: string;
      stripeProductId: string | null;
      stripePriceId: string | null;
      isActive: boolean;
      isDefault: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    await this.ensureDefaultBillingPlans();
    const plans = await this.dataSource.getRepository(BillingPlanEntity).find({
      order: {
        stripeMode: "ASC",
        amountCents: "ASC",
      },
    });

    return {
      stripeBillingMode: env.STRIPE_BILLING_MODE,
      items: plans.map((plan) => ({
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        amountCents: plan.amountCents,
        currency: plan.currency,
        interval: plan.interval,
        stripeMode: plan.stripeMode,
        stripeProductId: plan.stripeProductId,
        stripePriceId: plan.stripePriceId,
        isActive: plan.isActive,
        isDefault: plan.isDefault,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
      })),
    };
  }

  public async updateBillingPlan(id: string, input: unknown): Promise<BillingPlanEntity> {
    const data = billingPlanSchema.parse(input);
    const repository = this.dataSource.getRepository(BillingPlanEntity);
    const plan = await repository.findOne({ where: { id } });
    if (!plan) {
      throw new AppError("billing_plans.not_found", "Plano de assinatura não encontrado.", 404);
    }

    plan.name = data.name ?? plan.name;
    plan.description = data.description === undefined ? plan.description : data.description;
    plan.amountCents = data.amountCents ?? plan.amountCents;
    plan.currency = data.currency?.toLowerCase() ?? plan.currency;
    plan.interval = data.interval ?? plan.interval;
    plan.stripeProductId = data.stripeProductId === undefined ? plan.stripeProductId : data.stripeProductId;
    plan.stripePriceId = data.stripePriceId === undefined ? plan.stripePriceId : data.stripePriceId;
    plan.isActive = data.isActive ?? plan.isActive;
    plan.isDefault = data.isDefault ?? plan.isDefault;

    if (plan.isDefault) {
      await repository.update({ stripeMode: plan.stripeMode, isDefault: true }, { isDefault: false });
    }

    return repository.save(plan);
  }

  private async ensureDefaultBillingPlans(): Promise<void> {
    const repository = this.dataSource.getRepository(BillingPlanEntity);
    const defaultPlans = [
      this.createBillingPlan("plan_free_test", "free", "Gratuito", 0, "test", true),
      this.createBillingPlan("plan_pro_test", "pro", "Pro", 6990, "test", false),
      this.createBillingPlan("plan_premium_test", "premium", "Premium", 12990, "test", false),
      this.createBillingPlan("plan_free_live", "free", "Gratuito", 0, "live", true),
      this.createBillingPlan("plan_pro_live", "pro", "Pro", 6990, "live", false),
      this.createBillingPlan("plan_premium_live", "premium", "Premium", 12990, "live", false),
    ];
    const existingIds = new Set((await repository.find({ select: { id: true } })).map((plan) => plan.id));
    const missingPlans = defaultPlans.filter((plan) => !existingIds.has(plan.id));

    if (missingPlans.length > 0) {
      await repository.save(missingPlans);
    }
  }

  private createBillingPlan(
    id: string,
    code: "free" | "pro" | "premium",
    name: string,
    amountCents: number,
    stripeMode: "test" | "live",
    isDefault: boolean,
  ): BillingPlanEntity {
    const plan = new BillingPlanEntity();
    plan.id = id;
    plan.code = code;
    plan.name = name;
    plan.description = `Plano ${name} Hubly`;
    plan.amountCents = amountCents;
    plan.currency = "brl";
    plan.interval = "month";
    plan.stripeMode = stripeMode;
    plan.stripeProductId = null;
    plan.stripePriceId = null;
    plan.isActive = true;
    plan.isDefault = isDefault;
    return plan;
  }
}
