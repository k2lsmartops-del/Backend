import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Module d'authentification.
 * Configure JWT et Passport pour l'authentification par token.
 */
@Module({
  imports: [
    // ── Cache du contexte utilisateur (hot path) ──
    // JwtStrategy.validate() s'exécute sur CHAQUE requête authentifiée et
    // chargeait l'utilisateur + 2 jointures en base à chaque fois. À grande
    // échelle (polling du dashboard, 1000+ users), c'est le 1er goulot. On
    // met le contexte user en cache 30 s : un compte désactivé perd l'accès
    // au plus tard 30 s plus tard (tradeoff acceptable).
    CacheModule.register({ ttl: 30_000 }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (configService.get<string>('jwt.expiresIn') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
