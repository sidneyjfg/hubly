import { AuditRepository } from "../repositories/audit.repository";
import type { AuditEvent } from "../types/audit";
import type { AuthenticatedRequestUser } from "../types/auth";
import { parsePagination, type PaginatedResult, type PaginationInput } from "../utils/pagination";

export class AuditService {
  public constructor(private readonly auditRepository: AuditRepository) {}

  public async list(user: AuthenticatedRequestUser, paginationInput: PaginationInput = {}): Promise<PaginatedResult<AuditEvent>> {
    return this.auditRepository.findAll(user.organizationId, parsePagination(paginationInput));
  }
}
