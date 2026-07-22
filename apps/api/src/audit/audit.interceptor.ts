import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { AuditActorType, Role } from "@prisma/client";
import { AuditService } from "./audit.service";
import { AUDIT_ACTION_KEY, AuditLogOptions } from "./audit.decorator";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<AuditLogOptions>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    if (!options) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    return next.handle().pipe(
      tap((response) => {
        const actorType = options.actorType ?? this.inferActorType(user?.role);
        const entityId =
          options.entityIdField && response?.[options.entityIdField]
            ? String(response[options.entityIdField])
            : response?.id
              ? String(response.id)
              : "unknown";

        const metadata = options.metadataExtractor
          ? options.metadataExtractor(request, response)
          : undefined;

        this.auditService.log({
          actorUserId: user?.userId,
          actorType,
          action: options.action,
          entityType: options.entityType,
          entityId,
          metadata,
        }).catch(() => {
          // Audit log should never crash the request
        });
      }),
    );
  }

  private inferActorType(role?: string): AuditActorType {
    switch (role) {
      case Role.PATIENT:
        return "PATIENT";
      case Role.CLINICIAN:
        return "CLINICIAN";
      case Role.ADMIN:
        return "ADMIN";
      default:
        return "SYSTEM";
    }
  }
}
