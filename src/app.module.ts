import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UploadsModule } from './uploads/uploads.module';
import { PrismaModule } from './prisma/prisma.module';
import { ClustersModule } from './clusters/clusters.module';
import { CommunesModule } from './communes/communes.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import configuration from './config/configuration';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // Configuration globale avec validation des variables d'environnement
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    // ── Rate limiting global ──
    // 60 requêtes/min par IP. Un commercial fait ~25 requêtes par JOUR, donc
    // 60/min est très large pour un usage humain normal mais coupe net une
    // boucle de retry buggée (useEffect emballé, retry mal configuré) qui
    // pourrait saturer l'instance Render. Les limites par-route sont ajustées
    // via @Throttle() (auth serré, endpoints à fort polling élargis).
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // fenêtre glissante de 60 s
        limit: 60, // 60 requêtes max sur la fenêtre
      },
    ]),
    // Module Prisma (accès base de données)
    PrismaModule,
    // Module d'authentification
    AuthModule,
    // Module de gestion des utilisateurs
    UsersModule,
    // Module des soumissions terrain (prospects + marchands)
    SubmissionsModule,
    // Module uploads (signature Cloudinary)
    UploadsModule,
    // Modules gestion territoriale
    ClustersModule,
    CommunesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ThrottlerGuard en PREMIER guard global : le rate limiting s'applique
    // avant l'authentification, donc protège aussi les routes @Public()
    // (login/refresh) contre le brute force.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JwtAuthGuard appliqué globalement — toutes les routes exigent un token par défaut
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // RolesGuard appliqué globalement — vérifie les rôles si @Roles() est présent
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
