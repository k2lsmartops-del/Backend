import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';

// Extension du type Request pour inclure l'utilisateur authentifié
interface RequestWithUser extends Request {
  user: User;
}

/**
 * Décorateur @CurrentUser() — injecte l'utilisateur authentifié dans le handler.
 * L'utilisateur est attaché à la requête par le JwtStrategy après validation du token.
 *
 * @example
 * @Get('me')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
