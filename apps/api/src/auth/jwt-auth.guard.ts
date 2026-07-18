import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { JwtPayload } from "../auth/auth.service";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) =>
  Reflect.metadata(ROLES_KEY, roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) throw new UnauthorizedException("No token provided");

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      request.user = payload;

      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()]
      );
      if (requiredRoles && !requiredRoles.includes(payload.role)) {
        throw new UnauthorizedException("Insufficient permissions");
      }
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
