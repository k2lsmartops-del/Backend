import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Filtre d'exceptions GLOBAL.
 *
 * Objectif observabilité : aucune erreur ne doit échouer silencieusement.
 *  - 5xx → log niveau `error` AVEC la stack (cause technique à investiguer).
 *  - 4xx → log niveau `warn` (erreur métier/validation attendue, sans stack).
 *
 * Chaque log embarque le contexte de corrélation (requestId, méthode, route,
 * userId, rôle, status) pour pouvoir retracer le parcours d'un utilisateur.
 * La réponse renvoyée au client contient le `requestId` : un utilisateur qui
 * signale un bug n'a qu'à le communiquer pour qu'on retrouve la trace exacte.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<
      Request & {
        requestId?: string;
        user?: { id?: string; role?: string };
      }
    >();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | object = 'Erreur interne du serveur';
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      message =
        typeof response === 'string'
          ? response
          : ((response as { message?: string | object }).message ?? response);
    }

    const requestId = req.requestId;
    const contextLine =
      `reqId=${requestId} ${req.method} ${req.originalUrl} -> ${status} ` +
      `user=${req.user?.id ?? 'anon'} role=${req.user?.role ?? '-'}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Erreur technique inattendue : on veut la stack complète.
      this.logger.error(
        contextLine,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      // Erreur métier/validation attendue : warn sans stack pour rester lisible.
      const msg =
        typeof message === 'string' ? message : JSON.stringify(message);
      this.logger.warn(`${contextLine} | ${msg}`);
    }

    res.status(status).json({
      statusCode: status,
      message,
      requestId,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
