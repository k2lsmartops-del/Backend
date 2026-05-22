import { SetMetadata } from '@nestjs/common';

/**
 * Clé de métadonnée pour identifier les routes publiques.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Décorateur @Public() — exempte une route de l'authentification JWT.
 * À utiliser sur les routes comme /auth/login et /auth/refresh.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
