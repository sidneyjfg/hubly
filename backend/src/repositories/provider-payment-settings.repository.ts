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
      mercadoPagoConnected: settings.mercadoPagoConnected,
      mercadoPagoUserId: settings.mercadoPagoUserId,
      mercadoPagoAccessToken: settings.mercadoPagoAccessToken,
      mercadoPagoRefreshToken: settings.mercadoPagoRefreshToken,
      mercadoPagoTokenExpiresAt: settings.mercadoPagoTokenExpiresAt?.toISOString() ?? null,
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
      commissionRateBps: 1000,
      onlineDiscountBps: 500,
      absorbsProcessingFee: true,
      mercadoPagoConnected: false,
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
      mercadoPagoConnected: current.mercadoPagoConnected,
      mercadoPagoUserId: current.mercadoPagoUserId ?? null,
      mercadoPagoAccessToken: current.mercadoPagoAccessToken ?? null,
      mercadoPagoRefreshToken: current.mercadoPagoRefreshToken ?? null,
      mercadoPagoTokenExpiresAt: current.mercadoPagoTokenExpiresAt ? new Date(current.mercadoPagoTokenExpiresAt) : null,
    });

    return this.mapSettings(await repository.save(settings));
  }

  public async saveMercadoPagoConnection(
    organizationId: string,
    providerId: string,
    input: {
      mercadoPagoUserId: string;
      mercadoPagoAccessToken: string;
      mercadoPagoRefreshToken: string;
      mercadoPagoTokenExpiresAt: Date;
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
      mercadoPagoConnected: true,
      mercadoPagoUserId: input.mercadoPagoUserId,
      mercadoPagoAccessToken: input.mercadoPagoAccessToken,
      mercadoPagoRefreshToken: input.mercadoPagoRefreshToken,
      mercadoPagoTokenExpiresAt: input.mercadoPagoTokenExpiresAt,
    });

    return this.mapSettings(await repository.save(settings));
  }
}
