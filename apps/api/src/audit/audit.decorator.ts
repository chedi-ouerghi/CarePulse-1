import { SetMetadata } from "@nestjs/common";
import { AuditActorType } from "@prisma/client";

export const AUDIT_ACTION_KEY = "auditAction";
export const AUDIT_ENTITY_TYPE_KEY = "auditEntityType";

export interface AuditLogOptions {
  action: string;
  entityType: string;
  /**
   * Extract entity ID from the response. If not provided, uses "id" from response body.
   */
  entityIdField?: string;
  /**
   * Extract metadata from request/response. Called after the handler.
   */
  metadataExtractor?: (
    req: unknown,
    res: unknown,
  ) => Record<string, unknown> | undefined;
  /**
   * Override actor type. Defaults to inferring from user role.
   */
  actorType?: AuditActorType;
}

/**
 * Decorator for controller methods that should be audit-logged.
 *
 * Usage:
 *   @AuditLog({ action: "ALERT_ACKNOWLEDGED", entityType: "Alert" })
 *   acknowledge(...) { ... }
 */
export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_ACTION_KEY, options);
