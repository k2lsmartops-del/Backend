import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, User } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard RBAC — vérifie que l'utilisateur possède un des rôles autorisés.
 * Supporte les 5 rôles : ADMIN, COORDINATEUR, SUPERVISEUR, COMMERCIAL, CLIENT.
 *
 * Si aucun rôle n'est spécifié via @Roles(), la route est accessible à tous
 * les utilisateurs authentifiés.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Récupère les rôles requis définis par @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si aucun rôle n'est requis, la route est accessible à tous les authentifiés
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Récupère l'utilisateur depuis la requête (injecté par JwtStrategy)
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;

    // Vérifie si le rôle de l'utilisateur est dans la liste des rôles autorisés
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        "Accès refusé : vous n'avez pas les permissions nécessaires",
      );
    }

    return true;
  }
}
