import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UploadsModule } from './uploads/uploads.module';
import { PrismaModule } from './prisma/prisma.module';
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
