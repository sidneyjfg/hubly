import { randomUUID } from "node:crypto";
import type { DataSource } from "typeorm";
import { z } from "zod";
import type { Session } from "stripe/cjs/resources/Checkout/Sessions";
import type { Invoice } from "stripe/cjs/resources/Invoices";
import type { Subscription } from "stripe/cjs/resources/Subscriptions";

import { BillingPlanEntity, OrganizationSubscriptionEntity } from "../database/entities";
import type { AuthenticatedRequestUser } from "../types/auth";
import type { BillingPlan, OrganizationSubscription, SubscriptionCheckout, SubscriptionCustomerPortal } from "../types/billing";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";
import { StripeService } from "./stripe.service";

const changePlanSchema = z.object({
  planCode: z.enum(["free", "pro", "premium"]),
});

const paidSubscriptionStatuses = new Set(["active", "trialing", "past_due", "unpaid", "paused", "incomplete"]);

export class BillingService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly stripeService = new StripeService(),
  ) {}

  public async getOrganizationSubscription(user: AuthenticatedRequestUser): Promise<{
    stripeBillingMode: "test" | "live";
    current: OrganizationSubscription;
    plans: BillingPlan[];
  }> {
    await this.ensureDefaultBillingPlans();
    const plans = await this.listActivePlansForCurrentMode();
    const current = await this.getOrCreateSubscription(user.organizationId, plans);

    return {
      stripeBillingMode: env.STRIPE_BILLING_MODE,
      current,
      plans,
    };
  }

  public async changeOrganizationPlan(
    user: AuthenticatedRequestUser,
    input: unknown,
  ): Promise<OrganizationSubscription> {
    const data = changePlanSchema.parse(input);
    await this.ensureDefaultBillingPlans();
    const plans = await this.listActivePlansForCurrentMode();
    const targetPlan = plans.find((plan) => plan.code === data.planCode);
    if (!targetPlan) {
      throw new AppError("billing.plan_not_available", "Plano de assinatura indisponível neste ambiente.", 404);
    }
    if (targetPlan.amountCents > 0) {
      throw new AppError("billing.checkout_required", "Planos pagos precisam ser contratados pelo checkout.", 409);
    }

    const targetPlanEntity = await this.dataSource.getRepository(BillingPlanEntity).findOneByOrFail({
      id: targetPlan.id,
    });
    const subscriptionRepository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const currentEntity = await subscriptionRepository.findOne({
      where: {
        organizationId: user.organizationId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
      relations: {
        billingPlan: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    const subscription = currentEntity ?? subscriptionRepository.create({
      id: randomUUID(),
      organizationId: user.organizationId,
      status: "active",
      stripeMode: env.STRIPE_BILLING_MODE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeCheckoutSessionId: null,
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    subscription.billingPlanId = targetPlan.id;
    subscription.billingPlan = targetPlanEntity;
    subscription.stripePriceId = targetPlan.stripePriceId;
    subscription.status = "active";
    subscription.stripeMode = env.STRIPE_BILLING_MODE;

    const saved = await subscriptionRepository.save(subscription);
    const reloaded = await subscriptionRepository.findOneOrFail({
      where: {
        id: saved.id,
      },
      relations: {
        billingPlan: true,
      },
    });

    return this.mapSubscription(reloaded);
  }

  public async createSubscriptionCheckout(
    user: AuthenticatedRequestUser,
    input: unknown,
  ): Promise<SubscriptionCheckout> {
    const data = changePlanSchema.parse(input);
    await this.ensureDefaultBillingPlans();
    const targetPlan = (await this.listActivePlansForCurrentMode()).find((plan) => plan.code === data.planCode);
    if (!targetPlan) {
      throw new AppError("billing.plan_not_available", "Plano de assinatura indisponível neste ambiente.", 404);
    }
    if (targetPlan.code === "free" || targetPlan.amountCents <= 0) {
      const subscription = await this.cancelOrganizationSubscription(user);
      return {
        checkoutUrl: `${env.PUBLIC_WEB_APP_URL}/payments?plan=${subscription.plan.code}`,
      };
    }
    if (!targetPlan.stripePriceId) {
      throw new AppError("billing.price_not_configured", "Este plano ainda não está disponível para assinatura.", 409);
    }

    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const current = await repository.findOne({
      where: {
        organizationId: user.organizationId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
      relations: {
        billingPlan: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    const subscription = current ?? repository.create({
      id: randomUUID(),
      organizationId: user.organizationId,
      billingPlanId: targetPlan.id,
      status: "trialing",
      stripeMode: env.STRIPE_BILLING_MODE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeCheckoutSessionId: null,
      stripePriceId: null,
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    const checkout = await this.stripeService.createSubscriptionCheckoutSession({
      organizationId: user.organizationId,
      billingPlanId: targetPlan.id,
      planCode: targetPlan.code,
      priceId: targetPlan.stripePriceId,
      customerId: subscription.stripeCustomerId,
      successUrl: `${env.PUBLIC_WEB_APP_URL}/payments?checkout=success`,
      cancelUrl: `${env.PUBLIC_WEB_APP_URL}/payments?checkout=canceled`,
    });

    subscription.stripeCheckoutSessionId = checkout.id;
    await repository.save(subscription);

    return {
      checkoutUrl: checkout.url,
    };
  }

  public async cancelOrganizationSubscription(user: AuthenticatedRequestUser): Promise<OrganizationSubscription> {
    await this.ensureDefaultBillingPlans();
    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const current = await repository.findOne({
      where: {
        organizationId: user.organizationId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
      relations: {
        billingPlan: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
    if (!current) {
      const plans = await this.listActivePlansForCurrentMode();
      return this.getOrCreateSubscription(user.organizationId, plans);
    }

    if (current.stripeSubscriptionId) {
      const stripeSubscription = await this.stripeService.scheduleSubscriptionCancellation(current.stripeSubscriptionId);
      this.applyStripeSubscriptionSnapshot(current, stripeSubscription, current.billingPlan);
      const scheduledSubscription = await repository.save(current);
      return this.mapSubscription({
        ...scheduledSubscription,
        billingPlan: current.billingPlan,
      });
    }

    const freeSubscription = await this.moveSubscriptionToFree(current);
    return this.mapSubscription(freeSubscription);
  }

  public async createSubscriptionCustomerPortal(
    user: AuthenticatedRequestUser,
  ): Promise<SubscriptionCustomerPortal> {
    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const current = await repository.findOne({
      where: {
        organizationId: user.organizationId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
      relations: {
        billingPlan: true,
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (!current?.stripeCustomerId) {
      throw new AppError("billing.customer_portal_unavailable", "Portal de assinatura indisponível para esta organização.", 409);
    }

    const session = await this.stripeService.createBillingPortalSession({
      customerId: current.stripeCustomerId,
      returnUrl: `${env.PUBLIC_WEB_APP_URL}/payments?portal=return`,
    });

    return {
      portalUrl: session.url,
    };
  }

  public async handleSubscriptionCheckoutCompleted(session: Session): Promise<void> {
    if (session.metadata?.kind !== "hubly_subscription") return;
    const organizationId = session.metadata.organizationId;
    const billingPlanId = session.metadata.billingPlanId;
    if (!organizationId || !billingPlanId) return;

    const plan = await this.dataSource.getRepository(BillingPlanEntity).findOne({
      where: {
        id: billingPlanId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
    });
    if (!plan) return;
    const newStripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const current = await repository.findOne({
      where: {
        organizationId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
      order: {
        createdAt: "DESC",
      },
    });

    const subscription = current ?? repository.create({
      id: randomUUID(),
      organizationId,
      status: "active",
      stripeMode: env.STRIPE_BILLING_MODE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeCheckoutSessionId: null,
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    const previousStripeSubscriptionId = current?.stripeSubscriptionId ?? null;
    subscription.billingPlanId = plan.id;
    subscription.billingPlan = plan;
    subscription.status = "active";
    subscription.stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    subscription.stripeSubscriptionId = newStripeSubscriptionId;
    subscription.stripeCheckoutSessionId = session.id;
    subscription.stripePriceId = plan.stripePriceId;
    subscription.cancelAtPeriodEnd = false;

    await repository.save(subscription);

    if (previousStripeSubscriptionId && newStripeSubscriptionId && previousStripeSubscriptionId !== newStripeSubscriptionId) {
      await this.stripeService.cancelSubscriptionImmediately(previousStripeSubscriptionId);
    }
  }

  public async handleSubscriptionCheckoutExpired(session: Session): Promise<void> {
    if (session.metadata?.kind !== "hubly_subscription") return;

    const subscription = await this.dataSource.getRepository(OrganizationSubscriptionEntity).findOne({
      where: {
        stripeCheckoutSessionId: session.id,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
      relations: {
        billingPlan: true,
      },
    });
    if (!subscription || subscription.stripeSubscriptionId) return;

    subscription.status = "incomplete_expired";
    subscription.stripeCheckoutSessionId = null;

    await this.dataSource.getRepository(OrganizationSubscriptionEntity).save(subscription);
  }

  public async handleSubscriptionChanged(stripeSubscription: Subscription): Promise<void> {
    await this.ensureDefaultBillingPlans();
    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const current = await this.findSubscriptionEntityByStripeSubscriptionId(stripeSubscription.id)
      ?? await this.findSubscriptionEntityByOrganization(stripeSubscription.metadata.organizationId);
    const organizationId = current?.organizationId ?? stripeSubscription.metadata.organizationId;
    if (!organizationId) return;

    const plan = await this.resolvePlanForStripeSubscription(stripeSubscription);
    if (!plan) return;

    const subscription = current ?? repository.create({
      id: randomUUID(),
      organizationId,
      status: stripeSubscription.status,
      stripeMode: env.STRIPE_BILLING_MODE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeCheckoutSessionId: null,
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    this.applyStripeSubscriptionSnapshot(subscription, stripeSubscription, plan);
    await repository.save(subscription);
  }

  public async handleSubscriptionDeleted(stripeSubscription: Subscription): Promise<void> {
    await this.ensureDefaultBillingPlans();
    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const current = await this.findSubscriptionEntityByStripeSubscriptionId(stripeSubscription.id);
    if (!current) return;
    const organizationId = current.organizationId;

    current.stripeCustomerId = this.resolveCustomerId(stripeSubscription.customer) ?? current.stripeCustomerId ?? null;

    await this.moveSubscriptionToFree(current);
  }

  public async handleSubscriptionInvoicePaid(invoice: Invoice): Promise<void> {
    const subscription = await this.findSubscriptionEntity(this.resolveInvoiceSubscriptionId(invoice), invoice.customer);
    if (!subscription) return;

    subscription.status = "active";
    subscription.currentPeriodStart = this.timestampToDate(invoice.period_start) ?? subscription.currentPeriodStart;
    subscription.currentPeriodEnd = this.timestampToDate(invoice.period_end) ?? subscription.currentPeriodEnd;

    await this.dataSource.getRepository(OrganizationSubscriptionEntity).save(subscription);
  }

  public async handleSubscriptionInvoicePaymentFailed(invoice: Invoice): Promise<void> {
    const subscription = await this.findSubscriptionEntity(this.resolveInvoiceSubscriptionId(invoice), invoice.customer);
    if (!subscription) return;

    subscription.status = "past_due";
    subscription.currentPeriodStart = this.timestampToDate(invoice.period_start) ?? subscription.currentPeriodStart;
    subscription.currentPeriodEnd = this.timestampToDate(invoice.period_end) ?? subscription.currentPeriodEnd;

    await this.dataSource.getRepository(OrganizationSubscriptionEntity).save(subscription);
  }

  private async listActivePlansForCurrentMode(): Promise<BillingPlan[]> {
    const plans = await this.dataSource.getRepository(BillingPlanEntity).find({
      where: {
        stripeMode: env.STRIPE_BILLING_MODE,
        isActive: true,
      },
      order: {
        amountCents: "ASC",
      },
    });

    return plans.map((plan) => this.mapPlan(plan));
  }

  private async findSubscriptionEntity(
    stripeSubscriptionId: string | null | undefined,
    stripeCustomer: string | { id: string } | null | undefined,
  ): Promise<OrganizationSubscriptionEntity | null> {
    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const stripeCustomerId = this.resolveCustomerId(stripeCustomer);

    if (stripeSubscriptionId) {
      const bySubscription = await repository.findOne({
        where: {
          stripeMode: env.STRIPE_BILLING_MODE,
          stripeSubscriptionId,
        },
        relations: {
          billingPlan: true,
        },
        order: {
          createdAt: "DESC",
        },
      });
      if (bySubscription) return bySubscription;
    }

    if (!stripeCustomerId) return null;

    return repository.findOne({
      where: {
        stripeMode: env.STRIPE_BILLING_MODE,
        stripeCustomerId,
      },
      relations: {
        billingPlan: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  private async findSubscriptionEntityByStripeSubscriptionId(
    stripeSubscriptionId: string | null | undefined,
  ): Promise<OrganizationSubscriptionEntity | null> {
    if (!stripeSubscriptionId) return null;

    return this.dataSource.getRepository(OrganizationSubscriptionEntity).findOne({
      where: {
        stripeMode: env.STRIPE_BILLING_MODE,
        stripeSubscriptionId,
      },
      relations: {
        billingPlan: true,
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  private async findSubscriptionEntityByOrganization(
    organizationId: string | null | undefined,
  ): Promise<OrganizationSubscriptionEntity | null> {
    if (!organizationId) return null;

    return this.dataSource.getRepository(OrganizationSubscriptionEntity).findOne({
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
  }

  private async resolvePlanForStripeSubscription(stripeSubscription: Subscription): Promise<BillingPlanEntity | null> {
    const priceId = stripeSubscription.items.data[0]?.price.id ?? null;
    const billingPlanId = stripeSubscription.metadata.billingPlanId;

    if (priceId) {
      const byPrice = await this.dataSource.getRepository(BillingPlanEntity).findOne({
        where: {
          stripeMode: env.STRIPE_BILLING_MODE,
          stripePriceId: priceId,
        },
      });
      if (byPrice) return byPrice;
    }

    if (!billingPlanId) return null;

    return this.dataSource.getRepository(BillingPlanEntity).findOne({
      where: {
        id: billingPlanId,
        stripeMode: env.STRIPE_BILLING_MODE,
      },
    });
  }

  private async findFreePlan(): Promise<BillingPlanEntity | null> {
    return this.dataSource.getRepository(BillingPlanEntity).findOne({
      where: {
        code: "free",
        stripeMode: env.STRIPE_BILLING_MODE,
        isActive: true,
      },
    });
  }

  private async moveSubscriptionToFree(subscription: OrganizationSubscriptionEntity): Promise<OrganizationSubscriptionEntity> {
    const freePlan = await this.findFreePlan();
    if (!freePlan) {
      throw new AppError("billing.free_plan_not_available", "Plano gratuito indisponível neste ambiente.", 409);
    }

    subscription.billingPlanId = freePlan.id;
    subscription.billingPlan = freePlan;
    subscription.status = "active";
    subscription.stripeSubscriptionId = null;
    subscription.stripeCheckoutSessionId = null;
    subscription.stripePriceId = null;
    subscription.trialEndsAt = null;
    subscription.currentPeriodStart = null;
    subscription.currentPeriodEnd = null;
    subscription.cancelAtPeriodEnd = false;

    const saved = await this.dataSource.getRepository(OrganizationSubscriptionEntity).save(subscription);
    return {
      ...saved,
      billingPlan: freePlan,
    };
  }

  private applyStripeSubscriptionSnapshot(
    subscription: OrganizationSubscriptionEntity,
    stripeSubscription: Subscription,
    plan: BillingPlanEntity,
  ): void {
    subscription.billingPlanId = plan.id;
    subscription.billingPlan = plan;
    subscription.status = paidSubscriptionStatuses.has(stripeSubscription.status) ? stripeSubscription.status : "past_due";
    subscription.stripeMode = env.STRIPE_BILLING_MODE;
    subscription.stripeCustomerId = this.resolveCustomerId(stripeSubscription.customer) ?? subscription.stripeCustomerId ?? null;
    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.stripePriceId = stripeSubscription.items.data[0]?.price.id ?? plan.stripePriceId;
    subscription.trialEndsAt = this.timestampToDate(stripeSubscription.trial_end);
    subscription.currentPeriodStart = this.timestampToDate(stripeSubscription.items.data[0]?.current_period_start);
    subscription.currentPeriodEnd = this.timestampToDate(stripeSubscription.items.data[0]?.current_period_end);
    subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
  }

  private resolveInvoiceSubscriptionId(invoice: Invoice): string | null {
    const subscription = invoice.parent?.subscription_details?.subscription;
    if (!subscription) return null;
    return typeof subscription === "string" ? subscription : subscription.id;
  }

  private resolveCustomerId(customer: string | { id: string } | null | undefined): string | null {
    if (!customer) return null;
    return typeof customer === "string" ? customer : customer.id;
  }

  private timestampToDate(timestamp: number | null | undefined): Date | null {
    return timestamp ? new Date(timestamp * 1000) : null;
  }

  private async getOrCreateSubscription(
    organizationId: string,
    plans: BillingPlan[],
  ): Promise<OrganizationSubscription> {
    const repository = this.dataSource.getRepository(OrganizationSubscriptionEntity);
    const current = await repository.findOne({
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

    if (current) {
      return this.mapSubscription(current);
    }

    const defaultPlan = plans.find((plan) => plan.code === "free") ?? plans.find((plan) => plan.isDefault) ?? plans[0];
    if (!defaultPlan) {
      throw new AppError("billing.no_active_plan", "Nenhum plano de assinatura ativo foi configurado.", 409);
    }

    const saved = await repository.save({
      id: randomUUID(),
      organizationId,
      billingPlanId: defaultPlan.id,
      status: "trialing",
      stripeMode: env.STRIPE_BILLING_MODE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeCheckoutSessionId: null,
      stripePriceId: defaultPlan.stripePriceId,
      trialEndsAt: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    return this.mapSubscription({
      ...saved,
      billingPlan: await this.dataSource.getRepository(BillingPlanEntity).findOneByOrFail({ id: defaultPlan.id }),
    });
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
    code: BillingPlan["code"],
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

  private mapSubscription(subscription: OrganizationSubscriptionEntity): OrganizationSubscription {
    return {
      id: subscription.id,
      organizationId: subscription.organizationId,
      billingPlanId: subscription.billingPlanId,
      status: subscription.status as OrganizationSubscription["status"],
      stripeMode: subscription.stripeMode as OrganizationSubscription["stripeMode"],
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      stripeCheckoutSessionId: subscription.stripeCheckoutSessionId,
      stripePriceId: subscription.stripePriceId,
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      plan: this.mapPlan(subscription.billingPlan),
    };
  }

  private mapPlan(plan: BillingPlanEntity): BillingPlan {
    return {
      id: plan.id,
      code: plan.code as BillingPlan["code"],
      name: plan.name,
      description: plan.description,
      amountCents: plan.amountCents,
      currency: plan.currency,
      interval: plan.interval,
      stripeMode: plan.stripeMode as BillingPlan["stripeMode"],
      stripeProductId: plan.stripeProductId,
      stripePriceId: plan.stripePriceId,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
    };
  }
}
