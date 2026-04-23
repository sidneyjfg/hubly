export type AuditEvent = {
  id: string;
  clinicId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  occurredAt: string;
};
