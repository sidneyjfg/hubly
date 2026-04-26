import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, Unique } from "typeorm";

import { OrganizationEntity } from "./organization.entity";
import { ProviderEntity } from "./provider.entity";

@Entity({ name: "provider_availabilities" })
@Unique("uq_provider_availabilities_provider_weekday", ["providerId", "weekday"])
@Index("idx_provider_availabilities_organization_provider", ["organizationId", "providerId"])
export class ProviderAvailabilityEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 36 })
  public providerId!: string;

  @ManyToOne(() => ProviderEntity, (provider) => provider.availabilities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "providerId" })
  public provider!: ProviderEntity;

  @Column({ type: "int" })
  public weekday!: number;

  @Column({ type: "varchar", length: 5 })
  public workStart!: string;

  @Column({ type: "varchar", length: 5 })
  public workEnd!: string;

  @Column({ type: "varchar", length: 5, nullable: true })
  public lunchStart!: string | null;

  @Column({ type: "varchar", length: 5, nullable: true })
  public lunchEnd!: string | null;

  @Column({ type: "boolean", default: true })
  public isActive!: boolean;
}
