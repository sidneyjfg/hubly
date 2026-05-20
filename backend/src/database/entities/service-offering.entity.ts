import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";

import { BookingEntity } from "./booking.entity";
import { OrganizationEntity } from "./organization.entity";
import { ProviderEntity } from "./provider.entity";

@Entity({ name: "service_offerings" })
@Index("idx_service_offerings_organization_provider", ["organizationId", "providerId"])
export class ServiceOfferingEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 36 })
  public providerId!: string;

  @ManyToOne(() => ProviderEntity, (provider) => provider.services, { onDelete: "CASCADE" })
  @JoinColumn({ name: "providerId" })
  public provider!: ProviderEntity;

  @Column({ type: "varchar", length: 120 })
  public name!: string;

  @Column({ type: "int" })
  public durationMinutes!: number;

  @Column({ type: "int", nullable: true })
  public priceCents!: number | null;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => BookingEntity, (booking) => booking.offering)
  public bookings!: BookingEntity[];
}
