import type { DataSource, EntityManager } from "typeorm";

import { OrganizationPaymentSettingsEntity } from "../database/entities";
import type { OrganizationPaymentSettings } from "../types/payment";

export class OrganizationPaymentSettingsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(OrganizationPaymentSettingsEntity);
  }

  private mapSettings(settings: OrganizationPaymentSettingsEntity): OrganizationPaymentSettings {
    return {
      organizationId: settings.organizationId,
      commissionRateBps: settings.commissionRateBps,
      onlineDiscountBps: settings.onlineDiscountBps,
      absorbsProcessingFee: settings.absorbsProcessingFee,
      stripeAccountId: settings.stripeAccountId,
      stripeChargesEnabled: settings.stripeChargesEnabled,
      stripePayoutsEnabled: settings.stripePayoutsEnabled,
      stripeDetailsSubmitted: settings.stripeDetailsSubmitted,
      stripeCurrentlyDue: settings.stripeCurrentlyDue ?? [],
      stripeEventuallyDue: settings.stripeEventuallyDue ?? [],
      stripePastDue: settings.stripePastDue ?? [],
      stripeDisabledReason: settings.stripeDisabledReason,
      stripeAccountStatus: settings.stripeAccountStatus as OrganizationPaymentSettings["stripeAccountStatus"],
    };
  }

  public async findByOrganization(
    organizationId: string,
    manager?: EntityManager,
  ): Promise<OrganizationPaymentSettings | null> {
    const settings = await this.getRepository(manager).findOne({
      where: {
        organizationId,
      },
    });

    return settings ? this.mapSettings(settings) : null;
  }

  public async getOrCreateDefault(
    organizationId: string,
    manager?: EntityManager,
  ): Promise<OrganizationPaymentSettings> {
    const repository = this.getRepository(manager);
    const current = await this.findByOrganization(organizationId, manager);

    if (current) {
      return current;
    }

    const settings = await repository.save({
      organizationId,
      commissionRateBps: 0,
      onlineDiscountBps: 500,
      absorbsProcessingFee: true,
      stripeAccountId: null,
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
    input: Partial<Pick<OrganizationPaymentSettings, "commissionRateBps" | "onlineDiscountBps" | "absorbsProcessingFee">>,
    manager?: EntityManager,
  ): Promise<OrganizationPaymentSettings> {
    const repository = this.getRepository(manager);
    const current = await this.getOrCreateDefault(organizationId, manager);
    
    const settings = repository.create({
      organizationId,
      commissionRateBps: input.commissionRateBps ?? current.commissionRateBps,
      onlineDiscountBps: input.onlineDiscountBps ?? current.onlineDiscountBps,
      absorbsProcessingFee: input.absorbsProcessingFee ?? current.absorbsProcessingFee,
      stripeAccountId: current.stripeAccountId ?? null,
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

  public async saveStripeAccountId(
    organizationId: string,
    stripeAccountId: string,
    manager?: EntityManager,
  ): Promise<OrganizationPaymentSettings> {
    const repository = this.getRepository(manager);
    const current = await this.getOrCreateDefault(organizationId, manager);
    const settings = repository.create({
      organizationId,
      commissionRateBps: current.commissionRateBps,
      onlineDiscountBps: current.onlineDiscountBps,
      absorbsProcessingFee: current.absorbsProcessingFee,
      stripeAccountId,
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
    input: {
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
      currentlyDue: string[];
      eventuallyDue: string[];
      pastDue: string[];
      disabledReason?: string | null;
      accountStatus: OrganizationPaymentSettings["stripeAccountStatus"];
    },
    manager?: EntityManager,
  ): Promise<OrganizationPaymentSettings> {
    const repository = this.getRepository(manager);
    const current = await this.getOrCreateDefault(organizationId, manager);
    const settings = repository.create({
      organizationId,
      commissionRateBps: current.commissionRateBps,
      onlineDiscountBps: current.onlineDiscountBps,
      absorbsProcessingFee: current.absorbsProcessingFee,
      stripeAccountId: current.stripeAccountId ?? null,
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

  public async findByStripeAccountId(stripeAccountId: string, manager?: EntityManager): Promise<OrganizationPaymentSettings | null> {
    const settings = await this.getRepository(manager).findOne({ where: { stripeAccountId } });
    return settings ? this.mapSettings(settings) : null;
  }
}
