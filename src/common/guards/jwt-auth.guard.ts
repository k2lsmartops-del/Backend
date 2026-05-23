import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard JWT appliqué globalement sur toutes les routes.
 * Respecte le décorateur @Public() : si une route est marquée publique,
 * le guard laisse passer sans vérifier le token.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Vérifie si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la route est publique, on laisse passer sans authentification
    if (isPublic) {
      return true;
    }

    // Sinon, on délègue à AuthGuard('jwt') pour vérifier le token
    return super.canActivate(context);
  }
}
