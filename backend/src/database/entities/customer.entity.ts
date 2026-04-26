import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";

import { BookingEntity } from "./booking.entity";
import { OrganizationEntity } from "./organization.entity";

@Entity({ name: "customers" })
@Index("idx_customers_organization_id", ["organizationId"])
export class CustomerEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.customers, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 120 })
  public fullName!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  public email!: string | null;

  @Column({ type: "varchar", length: 30 })
  public phone!: string;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @OneToMany(() => BookingEntity, (booking) => booking.customer)
  public bookings!: BookingEntity[];
}
