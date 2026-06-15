import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Payload contenu dans l'access token JWT.
 */
interface JwtPayload {
  sub: string; // userId
  role: string;
  matricule: string;
}

/**
 * Stratégie JWT pour Passport.
 * Valide le token et charge l'utilisateur complet depuis la base.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error(
        "JWT_SECRET non défini dans les variables d'environnement",
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Appelé après validation du token.
   * Charge l'utilisateur complet et le retourne (sera attaché à request.user).
   */
  async validate(payload: JwtPayload) {
    // ── Cache du contexte user (hot path) ──
    // Servi depuis le cache mémoire (TTL 30 s) dans la grande majorité des
    // requêtes, ce qui évite un findUnique + 2 jointures par requête.
    const cacheKey = `auth:user:${payload.sub}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        cluster: { select: { id: true, name: true } },
        supervisor: { select: { id: true, fullName: true, matricule: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (!user.isActive || user.status !== 'ACTIF') {
      const messages: Record<string, string> = {
        SUSPENDU: 'Compte suspendu. Contactez votre superviseur.',
        EN_ATTENTE: 'Compte en attente de validation.',
        DESACTIVE: 'Compte désactivé.',
      };
      throw new UnauthorizedException(
        messages[user.status] || 'Compte désactivé',
      );
    }

    // Retourne l'utilisateur SANS le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    // Mise en cache du contexte (uniquement les comptes actifs valides).
    await this.cache.set(cacheKey, userWithoutPassword);

    return userWithoutPassword;
  }
}
