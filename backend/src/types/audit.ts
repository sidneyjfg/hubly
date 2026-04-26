export type AuditEvent = {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  occurredAt: string;
};
