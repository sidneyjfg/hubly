import { randomUUID } from "node:crypto";
import type { DataSource, EntityManager } from "typeorm";

import { PaymentTransactionEntity } from "../database/entities";
import type { PaymentBreakdown, PaymentStatus } from "../types/payment";

export class PaymentTransactionsRepository {
  public constructor(private readonly dataSource: DataSource) {}

  private getRepository(manager?: EntityManager) {
    return (manager ?? this.dataSource.manager).getRepository(PaymentTransactionEntity);
  }

  public async create(
    input: {
      organizationId: string;
      bookingId: string;
      providerId: string;
      breakdown: PaymentBreakdown;
      mercadoPagoPreferenceId?: string | null;
      checkoutUrl?: string | null;
    },
    manager?: EntityManager,
  ): Promise<PaymentTransactionEntity> {
    return this.getRepository(manager).save({
      id: randomUUID(),
      organizationId: input.organizationId,
      bookingId: input.bookingId,
      providerId: input.providerId,
      status: input.breakdown.paymentStatus,
      mercadoPagoPreferenceId: input.mercadoPagoPreferenceId ?? null,
      mercadoPagoPaymentId: null,
      originalAmountCents: input.breakdown.originalAmountCents,
      discountedAmountCents: input.breakdown.discountedAmountCents,
      onlineDiscountCents: input.breakdown.onlineDiscountCents,
      platformCommissionRateBps: input.breakdown.platformCommissionRateBps,
      platformCommissionCents: input.breakdown.platformCommissionCents,
      providerNetAmountCents: input.breakdown.providerNetAmountCents,
      checkoutUrl: input.checkoutUrl ?? null,
      rawGatewayPayload: null,
    });
  }

  public async findLatestByBookingId(bookingId: string, manager?: EntityManager): Promise<PaymentTransactionEntity | null> {
    return this.getRepository(manager).findOne({
      where: { bookingId },
      order: { createdAt: "DESC" },
    });
  }

  public async updateGatewayResult(
    id: string,
    input: {
      status: PaymentStatus;
      mercadoPagoPreferenceId?: string | null;
      mercadoPagoPaymentId?: string | null;
      checkoutUrl?: string | null;
      rawGatewayPayload?: unknown | null;
    },
    manager?: EntityManager,
  ): Promise<PaymentTransactionEntity> {
    const repository = this.getRepository(manager);
    const transaction = await repository.findOneOrFail({ where: { id } });
    transaction.status = input.status;
    transaction.mercadoPagoPreferenceId = input.mercadoPagoPreferenceId === undefined
      ? transaction.mercadoPagoPreferenceId
      : input.mercadoPagoPreferenceId;
    transaction.mercadoPagoPaymentId = input.mercadoPagoPaymentId === undefined
      ? transaction.mercadoPagoPaymentId
      : input.mercadoPagoPaymentId;
    transaction.checkoutUrl = input.checkoutUrl === undefined ? transaction.checkoutUrl : input.checkoutUrl;
    transaction.rawGatewayPayload = input.rawGatewayPayload === undefined ? transaction.rawGatewayPayload : input.rawGatewayPayload;

    return repository.save(transaction);
  }
}
