import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";

import { BookingEntity } from "./booking.entity";
import { OrganizationEntity } from "./organization.entity";
import { ProviderAvailabilityEntity } from "./provider-availability.entity";
import { ServiceOfferingEntity } from "./service-offering.entity";

@Entity({ name: "providers" })
@Index("idx_providers_organization_id", ["organizationId"])
export class ProviderEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.providers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 120 })
  public fullName!: string;

  @Column({ type: "varchar", length: 120 })
  public specialty!: string;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => BookingEntity, (booking) => booking.provider)
  public bookings!: BookingEntity[];

  @OneToMany(() => ServiceOfferingEntity, (serviceOffering) => serviceOffering.provider)
  public services!: ServiceOfferingEntity[];

  @OneToMany(() => ProviderAvailabilityEntity, (availability) => availability.provider)
  public availabilities!: ProviderAvailabilityEntity[];
}
