import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Attribue un identifiant de corrélation unique à chaque requête HTTP.
 *
 * - Réutilise l'en-tête `x-request-id` s'il est fourni par un proxy/client,
 *   sinon en génère un nouveau (UUID v4 natif Node, sans dépendance).
 * - Expose l'id dans la réponse (`x-request-id`) pour que le frontend / les
 *   utilisateurs puissent le communiquer lors d'un signalement de bug.
 * - L'id est ensuite repris par le filtre d'exceptions et l'intercepteur de
 *   logging pour retracer le parcours complet d'une requête dans les journaux.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();

    (req as Request & { requestId?: string }).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
