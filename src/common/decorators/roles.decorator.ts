import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Clé de métadonnée pour stocker les rôles autorisés sur une route.
 */
export const ROLES_KEY = 'roles';

/**
 * Décorateur @Roles() — restreint l'accès à une route aux rôles spécifiés.
 * Supporte les 5 rôles : ADMIN, COORDINATEUR, SUPERVISEUR, COMMERCIAL, CLIENT.
 *
 * @example
 * @Roles(Role.ADMIN, Role.COORDINATEUR)
 * @Get('admin-only')
 * getAdminData() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
