import type { DataSource, EntityManager } from "typeorm";

import {
  BookingEntity,
  CustomerEntity,
  OrganizationSubscriptionEntity,
  ProviderEntity,
} from "../database/entities";
import type { BillingPlanCode } from "../types/billing";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";

type PlanEntitlements = {
  maxProviders: number | null;
  maxCustomers: number | null;
  maxMonthlyBookings: number | null;
  maxGalleryImages: number;
  whatsappReminders: boolean;
  relationshipAutomations: boolean;
};

const planEntitlements: Record<BillingPlanCode, PlanEntitlements> = {
  free: {
    maxProviders: 1,
    maxCustomers: 50,
    maxMonthlyBookings: 30,
    maxGalleryImages: 1,
    whatsappReminders: false,
    relationshipAutomations: false,
  },
  pro: {
    maxProviders: 5,
    maxCustomers: 1000,
    maxMonthlyBookings: null,
    maxGalleryImages: 12,
    whatsappReminders: true,
    relationshipAutomations: false,
  },
  premium: {
    maxProviders: 15,
    maxCustomers: null,
    maxMonthlyBookings: null,
    maxGalleryImages: 12,
    whatsappReminders: true,
    relationshipAutomations: true,
  },
};

export class PlanEntitlementsService {
  public constructor(private readonly dataSource: DataSource) {}

  public async getPlanCode(organizationId: string, manager?: EntityManager): Promise<BillingPlanCode> {
    const repository = (manager ?? this.dataSource.manager).getRepository(OrganizationSubscriptionEntity);
    const subscription = await repository.findOne({
      where: {
        organizationId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
      relations: {
        billingPlan: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    const code = subscription?.billingPlan.code;
    if (code === "pro" || code === "premium") {
      return code;
    }

    return "free";
  }

  public async getEntitlements(organizationId: string, manager?: EntityManager): Promise<PlanEntitlements> {
    return planEntitlements[await this.getPlanCode(organizationId, manager)];
  }

  public async assertCanCreateProvider(organizationId: string, manager?: EntityManager): Promise<void> {
    const entitlements = await this.getEntitlements(organizationId, manager);
    if (entitlements.maxProviders === null) return;

    const total = await (manager ?? this.dataSource.manager).getRepository(ProviderEntity).count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    if (total >= entitlements.maxProviders) {
      throw new AppError("billing.plan_limit.providers", "Seu plano atingiu o limite de profissionais ativos.", 403);
    }
  }

  public async assertCanCreateCustomer(organizationId: string, manager?: EntityManager): Promise<void> {
    const entitlements = await this.getEntitlements(organizationId, manager);
    if (entitlements.maxCustomers === null) return;

    const total = await (manager ?? this.dataSource.manager).getRepository(CustomerEntity).count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    if (total >= entitlements.maxCustomers) {
      throw new AppError("billing.plan_limit.customers", "Seu plano atingiu o limite de clientes ativos.", 403);
    }
  }

  public async assertCanCreateBooking(organizationId: string, startsAt: Date, manager?: EntityManager): Promise<void> {
    const entitlements = await this.getEntitlements(organizationId, manager);
    if (entitlements.maxMonthlyBookings === null) return;

    const monthStart = new Date(Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(startsAt.getUTCFullYear(), startsAt.getUTCMonth() + 1, 1));
    const total = await (manager ?? this.dataSource.manager).getRepository(BookingEntity)
      .createQueryBuilder("booking")
      .where("booking.organizationId = :organizationId", { organizationId })
      .andWhere("booking.startsAt >= :monthStart", { monthStart })
      .andWhere("booking.startsAt < :nextMonthStart", { nextMonthStart })
      .andWhere("booking.status <> :cancelled", { cancelled: "cancelled" })
      .getCount();

    if (total >= entitlements.maxMonthlyBookings) {
      throw new AppError("billing.plan_limit.bookings", "Seu plano atingiu o limite mensal de agendamentos.", 403);
    }
  }

  public async assertCanUseWhatsAppReminders(organizationId: string, manager?: EntityManager): Promise<void> {
    const entitlements = await this.getEntitlements(organizationId, manager);
    if (!entitlements.whatsappReminders) {
      throw new AppError("billing.plan_feature.whatsapp", "Lembretes por WhatsApp estão disponíveis a partir do plano Pro.", 403);
    }
  }

  public async assertCanUseRelationshipAutomations(organizationId: string, manager?: EntityManager): Promise<void> {
    const entitlements = await this.getEntitlements(organizationId, manager);
    if (!entitlements.relationshipAutomations) {
      throw new AppError("billing.plan_feature.relationship", "Automações de relacionamento estão disponíveis no plano Premium.", 403);
    }
  }

  public async assertCanUseGallerySize(organizationId: string, imageCount: number, manager?: EntityManager): Promise<void> {
    const entitlements = await this.getEntitlements(organizationId, manager);
    if (imageCount > entitlements.maxGalleryImages) {
      throw new AppError("billing.plan_limit.gallery", "Seu plano atingiu o limite de fotos na vitrine.", 403);
    }
  }
}
