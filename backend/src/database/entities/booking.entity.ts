import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { OrganizationEntity } from "./organization.entity";
import { CustomerEntity } from "./customer.entity";
import { ProviderEntity } from "./provider.entity";
import { ServiceOfferingEntity } from "./service-offering.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "bookings" })
@Index("idx_bookings_organization_starts_at", ["organizationId", "startsAt"])
@Index("idx_bookings_provider_starts_at", ["providerId", "startsAt"])
export class BookingEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.bookings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 36 })
  public providerId!: string;

  @ManyToOne(() => ProviderEntity, (provider) => provider.bookings, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "providerId" })
  public provider!: ProviderEntity;

  @Column({ type: "varchar", length: 36, nullable: true })
  public offeringId!: string | null;

  @ManyToOne(() => ServiceOfferingEntity, (offering) => offering.bookings, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "offeringId" })
  public offering!: ServiceOfferingEntity | null;

  @Column({ type: "varchar", length: 36 })
  public customerId!: string;

  @ManyToOne(() => CustomerEntity, (customer) => customer.bookings, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "customerId" })
  public customer!: CustomerEntity;

  @Column({ type: "varchar", length: 36, nullable: true })
  public createdByUserId!: string | null;

  @ManyToOne(() => UserEntity, (user) => user.createdBookings, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "createdByUserId" })
  public createdBy!: UserEntity | null;

  @Column({ type: "varchar", length: 32 })
  public status!: string;

  @Column({ type: "datetime" })
  public startsAt!: Date;

  @Column({ type: "datetime" })
  public endsAt!: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  public notes!: string | null;

  @Column({ type: "varchar", length: 20, default: "presential" })
  public paymentType!: string;

  @Column({ type: "int", default: 0 })
  public originalAmountCents!: number;

  @Column({ type: "int", default: 0 })
  public discountedAmountCents!: number;

  @Column({ type: "int", default: 0 })
  public onlineDiscountCents!: number;

  @Column({ type: "int", default: 1000 })
  public platformCommissionRateBps!: number;

  @Column({ type: "int", default: 0 })
  public platformCommissionCents!: number;

  @Column({ type: "int", default: 0 })
  public providerNetAmountCents!: number;

  @Column({ type: "varchar", length: 32, default: "pending_local" })
  public paymentStatus!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  public paymentCheckoutUrl!: string | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;
}
