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
      mercadoPagoConnected: settings.mercadoPagoConnected,
      mercadoPagoUserId: settings.mercadoPagoUserId,
      mercadoPagoAccessToken: settings.mercadoPagoAccessToken,
      mercadoPagoRefreshToken: settings.mercadoPagoRefreshToken,
      mercadoPagoTokenExpiresAt: settings.mercadoPagoTokenExpiresAt?.toISOString() ?? null,
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
      commissionRateBps: 1000,
      onlineDiscountBps: 500,
      absorbsProcessingFee: true,
      mercadoPagoConnected: false,
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
    input: {
      mercadoPagoUserId: string;
      mercadoPagoAccessToken: string;
      mercadoPagoRefreshToken: string;
      mercadoPagoTokenExpiresAt: Date;
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
      mercadoPagoConnected: true,
      mercadoPagoUserId: input.mercadoPagoUserId,
      mercadoPagoAccessToken: input.mercadoPagoAccessToken,
      mercadoPagoRefreshToken: input.mercadoPagoRefreshToken,
      mercadoPagoTokenExpiresAt: input.mercadoPagoTokenExpiresAt,
    });

    return this.mapSettings(await repository.save(settings));
  }
}
