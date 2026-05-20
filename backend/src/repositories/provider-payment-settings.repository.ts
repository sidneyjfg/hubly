import type { DataSource, EntityManager } from "typeorm";

import { ProviderPaymentSettingsEntity } from "../database/entities";
import type { ProviderPaymentSettings } from "../types/payment";

export class ProviderPaymentSettingsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(ProviderPaymentSettingsEntity);
  }

  private mapSettings(settings: ProviderPaymentSettingsEntity): ProviderPaymentSettings {
    return {
      providerId: settings.providerId,
      organizationId: settings.organizationId,
      commissionRateBps: settings.commissionRateBps,
      onlineDiscountBps: settings.onlineDiscountBps,
      absorbsProcessingFee: settings.absorbsProcessingFee,
      stripeAccountId: settings.provider?.stripeAccountId ?? null,
      stripeChargesEnabled: settings.stripeChargesEnabled,
      stripePayoutsEnabled: settings.stripePayoutsEnabled,
      stripeDetailsSubmitted: settings.stripeDetailsSubmitted,
      stripeCurrentlyDue: settings.stripeCurrentlyDue ?? [],
      stripeEventuallyDue: settings.stripeEventuallyDue ?? [],
      stripePastDue: settings.stripePastDue ?? [],
      stripeDisabledReason: settings.stripeDisabledReason,
      stripeAccountStatus: settings.stripeAccountStatus as ProviderPaymentSettings["stripeAccountStatus"],
    };
  }

  public async findByProviderInOrganization(
    organizationId: string,
    providerId: string,
    manager?: EntityManager,
  ): Promise<ProviderPaymentSettings | null> {
    const settings = await this.getRepository(manager).findOne({
      where: {
        organizationId,
        providerId,
      },
      relations: {
        provider: true,
      },
    });

    return settings ? this.mapSettings(settings) : null;
  }

  public async getOrCreateDefault(
    organizationId: string,
    providerId: string,
    manager?: EntityManager,
  ): Promise<ProviderPaymentSettings> {
    const repository = this.getRepository(manager);
    const current = await this.findByProviderInOrganization(organizationId, providerId, manager);

    if (current) {
      return current;
    }

    const settings = await repository.save({
      providerId,
      organizationId,
      commissionRateBps: 0,
      onlineDiscountBps: 500,
      absorbsProcessingFee: true,
      stripeChargesEnabled: false,
      stripePayoutsEnabled: false,
      stripeDetailsSubmitted: false,
      stripeCurrentlyDue: [],
      stripeEventuallyDue: [],
      stripePastDue: [],
      stripeDisabledReason: null,
      stripeAccountStatus: "pending",
    });

    return this.mapSettings(settings);
  }

  public async updateInOrganization(
    organizationId: string,
    providerId: string,
    input: Partial<Pick<ProviderPaymentSettings, "commissionRateBps" | "onlineDiscountBps" | "absorbsProcessingFee">>,
    manager?: EntityManager,
  ): Promise<ProviderPaymentSettings> {
    const repository = this.getRepository(manager);
    const current = await this.getOrCreateDefault(organizationId, providerId, manager);
    const settings = repository.create({
      providerId,
      organizationId,
      commissionRateBps: input.commissionRateBps ?? current.commissionRateBps,
      onlineDiscountBps: input.onlineDiscountBps ?? current.onlineDiscountBps,
      absorbsProcessingFee: input.absorbsProcessingFee ?? current.absorbsProcessingFee,
      stripeChargesEnabled: current.stripeChargesEnabled,
      stripePayoutsEnabled: current.stripePayoutsEnabled,
      stripeDetailsSubmitted: current.stripeDetailsSubmitted,
      stripeCurrentlyDue: current.stripeCurrentlyDue,
      stripeEventuallyDue: current.stripeEventuallyDue,
      stripePastDue: current.stripePastDue,
      stripeDisabledReason: current.stripeDisabledReason ?? null,
      stripeAccountStatus: current.stripeAccountStatus,
    });

    return this.mapSettings(await repository.save(settings));
  }

  public async updateStripeAccountStatus(
    organizationId: string,
    providerId: string,
    input: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      currentlyDue: string[];
      eventuallyDue: string[];
      pastDue: string[];
      disabledReason?: string | null;
      accountStatus: ProviderPaymentSettings["stripeAccountStatus"];
    },
    manager?: EntityManager,
  ): Promise<ProviderPaymentSettings> {
    const repository = this.getRepository(manager);
    const current = await this.getOrCreateDefault(organizationId, providerId, manager);
    const settings = repository.create({
      providerId,
      organizationId,
      commissionRateBps: current.commissionRateBps,
      onlineDiscountBps: current.onlineDiscountBps,
      absorbsProcessingFee: current.absorbsProcessingFee,
      stripeChargesEnabled: input.chargesEnabled,
      stripePayoutsEnabled: input.payoutsEnabled,
      stripeDetailsSubmitted: input.detailsSubmitted,
      stripeCurrentlyDue: input.currentlyDue,
      stripeEventuallyDue: input.eventuallyDue,
      stripePastDue: input.pastDue,
      stripeDisabledReason: input.disabledReason ?? null,
      stripeAccountStatus: input.accountStatus,
    });

    return this.mapSettings(await repository.save(settings));
  }
}
