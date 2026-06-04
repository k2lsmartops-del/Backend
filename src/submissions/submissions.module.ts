import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

/**
 * Module de gestion des soumissions terrain (prospects + marchands).
 */
@Module({
  imports: [
    // ── Cache mémoire des KPIs du dashboard ──
    // TTL 300 000 ms = 5 min. Les ~13 COUNT(*) de getStats() deviennent très
    // coûteux à 50 000+ lignes ; on ne les recalcule qu'une fois par fenêtre
    // de 5 min et par contexte (rôle/user/zone). Store par défaut = mémoire
    // (suffisant pour le MVP, pas besoin de Redis). Pas d'invalidation
    // manuelle : le TTL de 5 min gère la fraîcheur (une fiche soumise à 14h02
    // apparaît au plus tard à 14h05 — acceptable pour des agrégats).
    // NB cache-manager v7 : le ttl est en MILLISECONDES.
    CacheModule.register({
      ttl: 300_000,
    }),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
