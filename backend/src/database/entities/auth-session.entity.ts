import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

import { UserEntity } from "./user.entity";

@Entity({ name: "auth_sessions" })
@Index("idx_auth_sessions_user_id", ["userId"])
@Index("idx_auth_sessions_expires_at", ["expiresAt"])
export class AuthSessionEntity {
  @PrimaryColumn({ type: "varchar", length: 36 })
  public id!: string;

  @Column({ type: "varchar", length: 36 })
  public userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  public user!: UserEntity;

  @Column({ type: "varchar", length: 255 })
  public refreshTokenHash!: string;

  @Column({ type: "datetime" })
  public expiresAt!: Date;

  @Column({ type: "datetime", nullable: true })
  public revokedAt!: Date | null;

  @CreateDateColumn({ type: "datetime" })
  public createdAt!: Date;
}
