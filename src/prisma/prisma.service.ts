import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Service Prisma injectable globalement.
 * Gère la connexion à la base de données PostgreSQL (Supabase).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    super({ adapter });
  }

  async onModuleInit() {
    // Connexion à la base au démarrage du module
    await this.$connect();
  }

  async onModuleDestroy() {
    // Déconnexion propre à l'arrêt de l'application
    await this.$disconnect();
  }
}
