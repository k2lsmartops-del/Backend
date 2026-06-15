import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

/**
 * Intercepteur de logging HTTP.
 *
 * Émet une ligne par requête terminée avec succès :
 *   `GET /api/submissions 200 42ms user=<id> reqId=<uuid>`
 *
 * Donne la visibilité de base sur le comportement du système (latence par
 * route, volume, qui appelle quoi). Combiné au filtre d'exceptions et au
 * requestId, il permet de retracer un parcours utilisateur de bout en bout.
 *
 * NB : les requêtes en erreur sont journalisées par le filtre d'exceptions
 * (avec le status réel), donc on ne loggue ici que le chemin nominal.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<
      Request & { requestId?: string; user?: { id?: string } }
    >();
    const res = http.getResponse<Response>();
    const start = Date.now();
    const { method, originalUrl } = req;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const userId = req.user?.id ?? 'anon';
        this.logger.log(
          `${method} ${originalUrl} ${res.statusCode} ${ms}ms user=${userId} reqId=${req.requestId}`,
        );
      }),
    );
  }
}
