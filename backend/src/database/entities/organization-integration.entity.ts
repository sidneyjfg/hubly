import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";

import { OrganizationEntity } from "./organization.entity";

@Entity({ name: "organization_integrations" })
@Index("uq_organization_integrations_organization_channel", ["organizationId", "channel"], { unique: true })
export class OrganizationIntegrationEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.integrations, { onDelete: "CASCADE" })
  @JoinColumn({ name: "organizationId" })
  public organization!: OrganizationEntity;

  @Column({ type: "varchar", length: 32 })
  public channel!: string;

  @Column({ type: "varchar", length: 32 })
  public provider!: string;

  @Column({ type: "varchar", length: 80 })
  public instanceName!: string;

  @Column({ type: "varchar", length: 32 })
  public status!: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  public phoneNumber!: string | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;

  @UpdateDateColumn({ type: "datetime" })
  public updatedAt!: Date;
}
