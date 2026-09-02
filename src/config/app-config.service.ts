import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

/**
 * Clés de configuration disponibles
 */
export const CONFIG_KEYS = {
  OBJECTIF_QUOTIDIEN_PAR_COMMERCIAL: 'objectif_quotidien_par_commercial',
  EFFECTIF_PREVU: 'effectif_prevu',
} as const;

/**
 * Valeurs par défaut
 */
const DEFAULT_VALUES: Record<string, { value: string; label: string }> = {
  [CONFIG_KEYS.OBJECTIF_QUOTIDIEN_PAR_COMMERCIAL]: {
    value: '11',
    label: 'Objectif quotidien de soumissions par commercial',
  },
  [CONFIG_KEYS.EFFECTIF_PREVU]: {
    value: '135',
    label: 'Effectif prévu de commerciaux',
  },
};

/**
 * Service de configuration centralisé.
 * Gère les paramètres globaux stockés en base de données.
 */
@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  private cache: Map<string, string> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Initialise les valeurs par défaut au démarrage si elles n'existent pas.
   */
  async onModuleInit() {
    for (const [key, { value, label }] of Object.entries(DEFAULT_VALUES)) {
      const existing = await this.prisma.config.findUnique({ where: { key } });
      if (!existing) {
        await this.prisma.config.create({
          data: { id: key, key, value, label },
        });
        this.logger.log(`Config initialisée: ${key} = ${value}`);
      }
    }
    await this.refreshCache();
  }

  /**
   * Rafraîchit le cache local depuis la base de données.
   */
  async refreshCache() {
    const configs = await this.prisma.config.findMany();
    this.cache.clear();
    for (const config of configs) {
      this.cache.set(config.key, config.value);
    }
    this.logger.debug(`Cache config rafraîchi: ${this.cache.size} entrées`);
  }

  /**
   * Récupère une valeur de configuration.
   */
  async get(key: string): Promise<string | null> {
    // D'abord le cache
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    // Sinon la base
    const config = await this.prisma.config.findUnique({ where: { key } });
    if (config) {
      this.cache.set(key, config.value);
      return config.value;
    }
    return null;
  }

  /**
   * Récupère une valeur numérique de configuration.
   */
  async getNumber(key: string, defaultValue: number): Promise<number> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Met à jour une valeur de configuration.
   */
  async set(key: string, value: string, label?: string): Promise<void> {
    await this.prisma.config.upsert({
      where: { key },
      update: { value, ...(label && { label }) },
      create: { id: key, key, value, label },
    });
    this.cache.set(key, value);
    this.logger.log(`Config mise à jour: ${key} = ${value}`);
  }

  /**
   * Récupère toutes les configurations.
   */
  async getAll(): Promise<{ key: string; value: string; label: string | null }[]> {
    const configs = await this.prisma.config.findMany({
      select: { key: true, value: true, label: true },
      orderBy: { key: 'asc' },
    });
    return configs;
  }

  // ════════════════════════════════════════════════════════════════════
  //  MÉTHODES MÉTIER CENTRALISÉES
  // ════════════════════════════════════════════════════════════════════

  /**
   * Retourne l'objectif quotidien par commercial (par défaut 11).
   */
  async getObjectifQuotidienParCommercial(): Promise<number> {
    return this.getNumber(CONFIG_KEYS.OBJECTIF_QUOTIDIEN_PAR_COMMERCIAL, 11);
  }

  /**
   * Retourne l'effectif prévu (par défaut 135).
   */
  async getEffectifPrevu(): Promise<number> {
    return this.getNumber(CONFIG_KEYS.EFFECTIF_PREVU, 135);
  }

  /**
   * Calcule l'objectif global quotidien.
   * Formule : effectifPrevu × objectifQuotidienParCommercial
   * 
   * L'effectif prévu (135 par défaut) sert de BASE fixe à l'objectif.
   * Les commerciaux actifs réels sont retournés à titre informatif.
   * 
   * @param clusterId - Optionnel, pour filtrer par cluster (non utilisé pour la base fixe)
   * @returns { objectifGlobal, commerciauxActifs, objectifParCommercial, effectifPrevu }
   */
  async getObjectifGlobalQuotidien(clusterId?: string): Promise<{
    objectifGlobal: number;
    commerciauxActifs: number;
    objectifParCommercial: number;
    effectifPrevu: number;
  }> {
    // L'effectif prévu est la base de calcul de l'objectif (ex: 135)
    const effectifPrevu = await this.getEffectifPrevu();
    const objectifParCommercial = await this.getObjectifQuotidienParCommercial();
    const objectifGlobal = effectifPrevu * objectifParCommercial;

    // Commerciaux actifs : informationnel (KPI de suivi)
    const commerciauxActifs = await this.prisma.user.count({
      where: {
        role: Role.COMMERCIAL,
        isActive: true,
        deletedAt: null,
        ...(clusterId && { clusterId }),
      },
    });

    return {
      objectifGlobal,
      commerciauxActifs,
      objectifParCommercial,
      effectifPrevu,
    };
  }

  /**
   * Calcule l'objectif pour une période donnée.
   * - Jour: effectifPrevu × objectifQuotidien × 1
   * - Semaine: effectifPrevu × objectifQuotidien × 6 (6 jours ouvrés)
   * - Mois: effectifPrevu × objectifQuotidien × 25 (25 jours ouvrés)
   */
  async getObjectifPourPeriode(
    period: 'day' | 'week' | 'month',
    clusterId?: string,
  ): Promise<{
    objectifTotal: number;
    commerciauxActifs: number;
    objectifParCommercial: number;
    effectifPrevu: number;
    multiplicateur: number;
  }> {
    const { objectifGlobal, commerciauxActifs, objectifParCommercial, effectifPrevu } = await this.getObjectifGlobalQuotidien(clusterId);
    
    const multiplicateur = period === 'day' ? 1 : period === 'week' ? 6 : 25;
    const objectifTotal = effectifPrevu * objectifParCommercial * multiplicateur;

    return {
      objectifTotal,
      commerciauxActifs,
      objectifParCommercial,
      effectifPrevu,
      multiplicateur,
    };
  }
}
