import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import {
  Role,
  SubmissionStatus,
  SubmissionType,
  User,
  ValidationAction,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';

/**
 * Select par défaut pour les soumissions (inclut relations utiles).
 */
const SUBMISSION_SELECT = {
  id: true,
  type: true,
  status: true,
  clientUuid: true,
  commune: true,
  quartier: true,
  addressNote: true,
  latitude: true,
  longitude: true,
  gpsAccuracy: true,
  gpsCapturedAt: true,
  // Champs prospect
  prospectFullName: true,
  prospectPhone: true,
  prospectProfession: true,
  prospectGender: true,
  prospectAge: true,
  appStatus: true,
  sponsorCode: true,
  observations: true,
  // Champs marchand
  merchantName: true,
  merchantOwner: true,
  merchantPhone: true,
  merchantActivity: true,
  merchantRccm: true,
  commercialId: true,
  // Sync
  syncStatus: true,
  createdOffline: true,
  // Dates
  createdAt: true,
  submittedAt: true,
  updatedAt: true,
  // Validation (workflow simplifié à 1 niveau)
  validatedAt: true,
  validationComment: true,
  // Relations
  commercial: { select: { id: true, fullName: true, matricule: true, sponsorCode: true } },
  validator: { select: { id: true, fullName: true, matricule: true } },
  photos: { select: { id: true, url: true, category: true } },
  clusterId: true,
};

/**
 * Forme des KPIs agrégés du dashboard (valeur mise en cache).
 */
export interface StatsResult {
  total: number;
  byStatus: {
    draft: number;
    submitted: number;
    validated: number;
    rejected: number;
  };
  byType: { prospects: number; marchands: number };
  today: { total: number; validated: number };
  week: { total: number; validated: number };
  validationRate: number;
  pending: number;
}

/**
 * KPIs Production
 */
interface ProductionKPIs {
  plannedWorkforce: number;  // Effectif prévu (configuré par le client)
  recruitedWorkforce: number; // Effectif recruté (total commerciaux actifs)
  activeTodayWorkforce: number; // Effectif actif (commerciaux ayant travaillé)
  clientsApproached: number; // Clients approchés (nombre brut de soumissions)
  installations: number;
  installationsPlusActivations: number; // Installations + Activations
  activationRate: number; // Taux d'activation = activations / installations * 100
}

/**
 * KPIs Performance
 */
interface PerformanceKPIs {
  objective: number;
  achieved: number;
  achievementPercent: number;
  productivityPerAgent: number;
  clusterPerformance: { clusterId: string; clusterName: string; achieved: number; objective: number }[];
}

/**
 * KPIs Qualité
 */
interface QualityKPIs {
  filesSubmitted: number;
  filesValidated: number;
  filesRejected: number;
  validationRate: number;
}

/**
 * KPIs Pilotage
 */
interface PilotageKPIs {
  coveredZones: number;
  mainAlerts: { type: string; count: number; message: string }[];
  globalScore: number;
}

/**
 * Interface complète pour les KPIs structurés
 */
export interface ComprehensiveKPIs {
  production: ProductionKPIs;
  performance: PerformanceKPIs;
  quality: QualityKPIs;
  pilotage: PilotageKPIs;
}

/**
 * Service de gestion des soumissions terrain.
 * Gère création, soumission, listing, validation N1/N2, rejet.
 */
@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  /**
   * Crée une soumission (brouillon ou directement soumise).
   * Appelé par le COMMERCIAL.
   *
   * Idempotence : si clientUuid existe déjà → retourne l'existante.
   * Doublon prospect : si prospectPhone existe déjà → signale sans bloquer.
   */
  async create(dto: CreateSubmissionDto, user: Omit<User, 'password'>) {
    // ── Vérification du code de parrainage du commercial ──
    if (user.role === Role.COMMERCIAL) {
      const commercial = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { sponsorCode: true },
      });

      if (!commercial || !commercial.sponsorCode) {
        throw new BadRequestException(
          'Vous devez avoir un code de parrainage pour effectuer des soumissions. Contactez votre superviseur.'
        );
      }

      // Utiliser automatiquement le code de parrainage du commercial si non fourni
      if (!dto.sponsorCode) {
        dto.sponsorCode = commercial.sponsorCode;
      }
    }

    // ── Idempotence : rejeu offline ──
    const existing = await this.prisma.submission.findUnique({
      where: { clientUuid: dto.clientUuid },
      select: SUBMISSION_SELECT,
    });
    if (existing) return { ...existing, _idempotent: true };

    // ── Déterminer le statut final ──
    const isDraft = dto.requestedStatus === 'DRAFT';
    const targetStatus = isDraft
      ? SubmissionStatus.DRAFT
      : SubmissionStatus.SUBMITTED;

    // ── Validation champs + photos si SUBMITTED ──
    if (!isDraft) {
      this.validateFieldsByType(dto);
      this.validatePhotosByType(dto);
    }

    // ── Doublon prospect (signaler sans bloquer) ──
    let _duplicateWarning: string | undefined;
    if (
      dto.type === SubmissionType.PROSPECT &&
      dto.prospectPhone
    ) {
      const duplicate = await this.prisma.submission.findFirst({
        where: {
          prospectPhone: dto.prospectPhone,
          clientUuid: { not: dto.clientUuid },
        },
        select: { id: true, commercialId: true, createdAt: true },
      });
      if (duplicate) {
        _duplicateWarning = `Prospect avec ce téléphone déjà enregistré (soumission ${duplicate.id})`;
      }
    }

    // ── Résolution commune/quartier (ID ou texte libre) ──
    let communeId: string | null = null;
    let communeName: string = dto.commune || '';
    let quartierId: string | null = null;
    let quartierName: string | null = dto.quartier || null;

    // Si communeId fourni → récupérer le nom depuis la DB
    if (dto.communeId) {
      const commune = await this.prisma.commune.findUnique({
        where: { id: dto.communeId },
        select: { id: true, name: true },
      });
      if (commune) {
        communeId = commune.id;
        communeName = commune.name;
      }
    }

    // Si quartierId fourni → récupérer le nom depuis la DB
    if (dto.quartierId) {
      const quartier = await this.prisma.quartier.findUnique({
        where: { id: dto.quartierId },
        select: { id: true, name: true },
      });
      if (quartier) {
        quartierId = quartier.id;
        quartierName = quartier.name;
      }
    }

    const submission = await this.prisma.submission.create({
      data: {
        type: dto.type,
        clientUuid: dto.clientUuid,
        status: targetStatus,
        commercialId: user.id,
        clusterId: user.clusterId || null,
        communeId: communeId,
        commune: communeName,
        quartier: quartierName,
        addressNote: dto.addressNote || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        gpsAccuracy: dto.gpsAccuracy || null,
        gpsCapturedAt: dto.gpsCapturedAt ? new Date(dto.gpsCapturedAt) : null,
        // Prospect
        prospectFullName: dto.prospectFullName || null,
        prospectPhone: dto.prospectPhone || null,
        prospectProfession: dto.prospectProfession || null,
        prospectGender: dto.prospectGender || null,
        prospectAge: dto.prospectAge || null,
        appStatus: dto.appStatus || null,
        sponsorCode: dto.sponsorCode || null,
        observations: dto.observations || null,
        // Marchand
        merchantName: dto.merchantName || null,
        merchantOwner: dto.merchantOwner || null,
        merchantPhone: dto.merchantPhone || null,
        merchantActivity: dto.merchantActivity || null,
        merchantRccm: dto.merchantRccm || null,
        // Photos (métadonnées Cloudinary)
        photos: dto.photos?.length
          ? {
              create: dto.photos.map((p) => ({
                cloudinaryPublicId: p.cloudinaryPublicId,
                url: p.url,
                category: p.category,
                width: p.width || null,
                height: p.height || null,
                bytes: p.bytes || null,
              })),
            }
          : undefined,
        // Sync
        createdOffline: dto.createdOffline || false,
        syncStatus: dto.syncStatus || 'SYNCED',
        submittedAt: isDraft ? null : new Date(),
        // Historique
        validationHistory: isDraft
          ? undefined
          : {
              create: {
                actorId: user.id,
                action: ValidationAction.SUBMITTED,
              },
            },
      },
      select: SUBMISSION_SELECT,
    });

    return { ...submission, _duplicateWarning };
  }

  /**
   * Synchronisation batch — crée plusieurs soumissions.
   * Chaque soumission est traitée individuellement : un échec n'empêche pas les autres.
   */
  async syncBatch(dtos: CreateSubmissionDto[], user: Omit<User, 'password'>) {
    const results: {
      clientUuid: string;
      status: string;
      data?: unknown;
      error?: string;
    }[] = [];

    for (const dto of dtos) {
      try {
        const data = await this.create(dto, user);
        results.push({ clientUuid: dto.clientUuid, status: 'synced', data });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        // Ne pas avaler l'échec en silence : une soumission terrain perdue est
        // un incident métier. On trace clientUuid + commercial + cause/stack
        // pour pouvoir investiguer un signalement « ma fiche a disparu ».
        this.logger.error(
          `Sync échouée clientUuid=${dto.clientUuid} commercialId=${user.id}: ${message}`,
          err instanceof Error ? err.stack : undefined,
        );
        results.push({
          clientUuid: dto.clientUuid,
          status: 'failed',
          error: message,
        });
      }
    }

    return {
      total: results.length,
      synced: results.filter((r) => r.status === 'synced').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    };
  }

  /**
   * Liste paginée des soumissions avec filtres.
   * Respecte les rôles :
   *  - COMMERCIAL : voit uniquement ses soumissions
   *  - SUPERVISEUR : voit les soumissions de son cluster (status >= SUBMITTED)
   *  - COORDINATEUR : voit TOUTES les soumissions (compte global)
   *  - ADMIN : voit tout
   */
  async findAll(query: QuerySubmissionsDto, user: Omit<User, 'password'>) {
    const {
      type,
      status,
      clusterId,
      commercialId,
      commune,
      search,
      startDate,
      endDate,
      period,
    } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Filtres par rôle
    switch (user.role) {
      case Role.COMMERCIAL:
        where.commercialId = user.id;
        break;
      case Role.SUPERVISEUR:
        where.clusterId = user.clusterId;
        where.status = { notIn: [SubmissionStatus.DRAFT] };
        break;
      case Role.COORDINATEUR:
      case Role.ADMIN:
        // Pas de restriction — compte global
        break;
      case Role.CLIENT:
        // CLIENT ne voit que les soumissions validées
        where.status = SubmissionStatus.VALIDATED;
        break;
      default:
        where.commercialId = user.id;
    }

    // Filtres optionnels
    if (type) where.type = type;
    if (status) where.status = status;
    if (clusterId) where.clusterId = clusterId;
    if (commercialId) where.commercialId = commercialId;
    if (commune) where.commune = commune;

    // Filtre par période (prioritaire sur startDate/endDate)
    if (period) {
      const now = new Date();
      if (period === 'day') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        where.createdAt = { gte: today };
      } else if (period === 'week') {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        where.createdAt = { gte: weekStart };
      } else if (period === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        where.createdAt = { gte: monthStart };
      }
    } else if (startDate || endDate) {
      // Filtre par date (si pas de période)
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        // Inclure toute la journée de fin
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = endOfDay;
      }
    }

    if (search) {
      where.OR = [
        { prospectFullName: { contains: search, mode: 'insensitive' } },
        { prospectPhone: { contains: search, mode: 'insensitive' } },
        { merchantName: { contains: search, mode: 'insensitive' } },
        { merchantPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        select: SUBMISSION_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      data: submissions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Détail d'une soumission.
   */
  async findOne(id: string, user: Omit<User, 'password'>) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      select: {
        ...SUBMISSION_SELECT,
        validationHistory: {
          select: {
            id: true,
            action: true,
            comment: true,
            createdAt: true,
            actor: { select: { id: true, fullName: true, matricule: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    // Vérifie l'accès selon le rôle
    this.checkAccessToSubmission(submission, user);

    return submission;
  }

  /**
   * Modifie une soumission.
   * RÈGLE : seules les soumissions DRAFT ou SUBMITTED peuvent être modifiées.
   * Le commercial doit être le propriétaire.
   * Retourne le statut actuel si la soumission a déjà été validée.
   */
  async update(
    id: string,
    dto: import('./dto/update-submission.dto').UpdateSubmissionDto,
    user: Omit<User, 'password'>,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      select: { id: true, status: true, commercialId: true },
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    // Seul le propriétaire peut modifier
    if (submission.commercialId !== user.id) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres soumissions');
    }

    // Vérification statut — refuser si déjà en cours de validation
    if (
      submission.status !== SubmissionStatus.DRAFT &&
      submission.status !== SubmissionStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Modification impossible : la soumission est au statut "${submission.status}". Elle a déjà été prise en charge.`,
      );
    }

    // Préparer les données de mise à jour (exclure photos)
    const { photos, ...fields } = dto;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      ...fields,
      gpsCapturedAt: fields.gpsCapturedAt
        ? new Date(fields.gpsCapturedAt)
        : undefined,
    };

    // Si de nouvelles photos sont fournies, les remplacer
    if (photos && photos.length > 0) {
      data.photos = {
        deleteMany: {},
        create: photos.map((p) => ({
          url: p.url,
          cloudinaryPublicId: p.cloudinaryPublicId,
          category: p.category,
          width: p.width,
          height: p.height,
          bytes: p.bytes,
        })),
      };
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data,
      select: SUBMISSION_SELECT,
    });

    return updated;
  }

  /**
   * Vérifie le statut actuel d'une soumission (pour le frontend avant édition).
   * Retourne { editable: boolean, status: string }
   */
  async checkEditable(id: string, user: Omit<User, 'password'>) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      select: { id: true, status: true, commercialId: true },
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    if (submission.commercialId !== user.id) {
      throw new ForbiddenException('Accès interdit');
    }

    const editable =
      submission.status === SubmissionStatus.DRAFT ||
      submission.status === SubmissionStatus.SUBMITTED;

    return { editable, status: submission.status };
  }

  /**
   * Supprime une soumission.
   * RÈGLE : seules DRAFT ou SUBMITTED peuvent être supprimées par le propriétaire.
   */
  async remove(id: string, user: Omit<User, 'password'>) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      select: { id: true, status: true, commercialId: true },
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    if (submission.commercialId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres soumissions',
      );
    }

    if (
      submission.status !== SubmissionStatus.DRAFT &&
      submission.status !== SubmissionStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        `Suppression impossible : la soumission est au statut "${submission.status}".`,
      );
    }

    await this.prisma.submission.delete({ where: { id } });

    return { deleted: true };
  }

  /**
   * Validation par le COORDINATEUR (workflow simplifié à 1 niveau).
   * Passe de SUBMITTED → VALIDATED.
   */
  async validate(
    id: string,
    user: Omit<User, 'password'>,
    comment?: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new BadRequestException(
        'Cette soumission ne peut pas être validée (statut actuel : ' +
          submission.status +
          ')',
      );
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.VALIDATED,
        validatorId: user.id,
        validatedAt: new Date(),
        validationComment: comment || null,
        validationHistory: {
          create: {
            actorId: user.id,
            action: ValidationAction.VALIDATED,
            comment: comment || null,
          },
        },
      },
      select: SUBMISSION_SELECT,
    });
  }

  /**
   * Rejet par le COORDINATEUR (workflow simplifié à 1 niveau).
   * Passe de SUBMITTED → REJECTED.
   */
  async reject(
    id: string,
    user: Omit<User, 'password'>,
    comment: string,
  ) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Soumission non trouvée');
    }

    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new BadRequestException(
        'Cette soumission ne peut pas être rejetée (statut actuel : ' +
          submission.status +
          ')',
      );
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED,
        validatorId: user.id,
        validatedAt: new Date(),
        validationComment: comment,
        validationHistory: {
          create: {
            actorId: user.id,
            action: ValidationAction.REJECTED,
            comment,
          },
        },
      },
      select: SUBMISSION_SELECT,
    });
  }

  /**
   * Statistiques pour le dashboard.
   * Filtrées selon le rôle de l'utilisateur.
   * Retourne les KPIs structurés en 4 catégories : Production, Performance, Qualité, Pilotage.
   */
  async getStats(
    user: Omit<User, 'password'>,
    clusterId?: string,
    period: 'day' | 'week' | 'month' = 'day',
  ) {
    // ── Cache des KPIs ──
    const cacheKey = `dashboard:stats:${user.role}:${user.id}:${clusterId || 'all'}:${period}`;
    const cached = await this.cache.get<ComprehensiveKPIs>(cacheKey);
    if (cached) {
      this.logger.debug(`KPIs servis depuis le cache (${cacheKey})`);
      return cached;
    }
    this.logger.debug(`KPIs recalculés — COUNT en base (${cacheKey})`);

    // Déterminer le filtre de cluster
    let effectiveClusterId: string | undefined;
    if ((user.role === Role.COORDINATEUR || user.role === Role.ADMIN) && clusterId) {
      effectiveClusterId = clusterId;
    } else if (user.role === Role.SUPERVISEUR && user.clusterId) {
      effectiveClusterId = user.clusterId;
    }

    const where: Record<string, unknown> = {};
    if (effectiveClusterId) {
      where.clusterId = effectiveClusterId;
    }

    // Pour le CLIENT, on filtre par son clientId (lié à son compte)
    if (user.role === Role.CLIENT) {
      where.status = SubmissionStatus.VALIDATED;
    }

    // Filtre temporel selon la période
    const now = new Date();
    if (period === 'day') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: today };
    } else if (period === 'week') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      where.createdAt = { gte: weekStart };
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      where.createdAt = { gte: monthStart };
    }

    // ── Production KPIs ──
    // Effectif prévu (configuré par le client - valeur statique pour l'instant)
    const plannedWorkforce = 135; // TODO: Rendre configurable par client

    // Effectif recruté (commerciaux actifs et fonctionnels)
    const recruitedWorkforce = await this.prisma.user.count({
      where: { 
        role: Role.COMMERCIAL,
        isActive: true,
        ...(effectiveClusterId && { clusterId: effectiveClusterId })
      }
    });

    // Effectif actif (commerciaux qui ont travaillé pendant la période)
    // - Jour: commerciaux ayant fait au moins 1 soumission aujourd'hui
    // - Semaine: commerciaux ayant travaillé au moins 6 jours sur 7
    // - Mois: commerciaux ayant travaillé au moins 4 semaines (24 jours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let activeTodayWorkforce = 0;
    
    if (period === 'day') {
      // Commerciaux ayant fait au moins 1 soumission aujourd'hui
      const activeCommercials = await this.prisma.submission.groupBy({
        by: ['commercialId'],
        where: {
          createdAt: { gte: today },
          ...(effectiveClusterId && { clusterId: effectiveClusterId })
        }
      });
      activeTodayWorkforce = activeCommercials.length;
    } else if (period === 'week') {
      // Commerciaux ayant travaillé au moins 6 jours sur 7 cette semaine
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      // Récupérer les jours travaillés par commercial cette semaine
      const submissions = await this.prisma.submission.findMany({
        where: {
          createdAt: { gte: weekStart },
          ...(effectiveClusterId && { clusterId: effectiveClusterId })
        },
        select: { commercialId: true, createdAt: true }
      });
      
      // Compter les jours distincts par commercial
      const commercialDays = new Map<string, Set<string>>();
      for (const sub of submissions) {
        const dayKey = sub.createdAt.toISOString().split('T')[0];
        if (!commercialDays.has(sub.commercialId)) {
          commercialDays.set(sub.commercialId, new Set());
        }
        commercialDays.get(sub.commercialId)!.add(dayKey);
      }
      
      // Compter ceux qui ont travaillé au moins 6 jours
      activeTodayWorkforce = Array.from(commercialDays.values()).filter(days => days.size >= 6).length;
    } else if (period === 'month') {
      // Commerciaux ayant travaillé au moins 24 jours ce mois (4 semaines x 6 jours)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const submissions = await this.prisma.submission.findMany({
        where: {
          createdAt: { gte: monthStart },
          ...(effectiveClusterId && { clusterId: effectiveClusterId })
        },
        select: { commercialId: true, createdAt: true }
      });
      
      // Compter les jours distincts par commercial
      const commercialDays = new Map<string, Set<string>>();
      for (const sub of submissions) {
        const dayKey = sub.createdAt.toISOString().split('T')[0];
        if (!commercialDays.has(sub.commercialId)) {
          commercialDays.set(sub.commercialId, new Set());
        }
        commercialDays.get(sub.commercialId)!.add(dayKey);
      }
      
      // Compter ceux qui ont travaillé au moins 24 jours (4 semaines x 6 jours)
      activeTodayWorkforce = Array.from(commercialDays.values()).filter(days => days.size >= 24).length;
    }

    // Installations (appStatus = INSTALLED ou INSTALLED_ACTIVATED)
    const installations = await this.prisma.submission.count({
      where: { 
        ...where, 
        type: SubmissionType.PROSPECT, 
        status: SubmissionStatus.VALIDATED,
        appStatus: { in: ['INSTALLED', 'INSTALLED_ACTIVATED'] }
      }
    });

    // Activations (appStatus = INSTALLED_ACTIVATED)
    const activations = await this.prisma.submission.count({
      where: { 
        ...where, 
        type: SubmissionType.PROSPECT, 
        status: SubmissionStatus.VALIDATED,
        appStatus: 'INSTALLED_ACTIVATED'
      }
    });

    // Clients approchés (nombre brut de toutes les soumissions - prospects + marchands)
    const clientsApproached = await this.prisma.submission.count({
      where: { ...where }
    });

    // Taux d'activation = activations / installations * 100
    const activationRate = installations > 0 
      ? Math.round((activations / installations) * 1000) / 10 // Arrondi à 1 décimale
      : 0;

    // Installations + Activations
    const installationsPlusActivations = installations + activations;

    const production: ProductionKPIs = {
      plannedWorkforce,
      recruitedWorkforce,
      activeTodayWorkforce,
      clientsApproached,
      installations,
      installationsPlusActivations,
      activationRate,
    };

    // ── Performance KPIs ──
    // Objectif selon la période (1620/jour pour 135 commerciaux = 12/jour par commercial)
    // Jour: 12, Semaine: 12*7=84, Mois: 12*30=360
    const quotaPerAgent = period === 'day' ? 12 : period === 'week' ? 84 : 360;
    const objective = activeTodayWorkforce * quotaPerAgent;
    const achieved = clientsApproached;
    const achievementPercent = objective > 0 ? Math.round((achieved / objective) * 100) : 0;
    const productivityPerAgent = activeTodayWorkforce > 0 ? Math.round(achieved / activeTodayWorkforce) : 0;

    // Performance par cluster
    const clusters = await this.prisma.cluster.findMany({
      where: effectiveClusterId ? { id: effectiveClusterId } : {},
      include: {
        _count: { select: { members: { where: { role: Role.COMMERCIAL, isActive: true } } } }
      }
    });

    const clusterPerformance = await Promise.all(
      clusters.map(async (cluster) => {
        const clusterWhere = { ...where, clusterId: cluster.id };
        const clusterAgents = cluster._count.members;
        const clusterObjective = clusterAgents * quotaPerAgent;
        const clusterAchieved = await this.prisma.submission.count({
          where: { ...clusterWhere, status: SubmissionStatus.VALIDATED }
        });
        return {
          clusterId: cluster.id,
          clusterName: cluster.name,
          achieved: clusterAchieved,
          objective: clusterObjective
        };
      })
    );

    const performance: PerformanceKPIs = {
      objective,
      achieved,
      achievementPercent,
      productivityPerAgent,
      clusterPerformance
    };

    // ── Quality KPIs ──
    const filesSubmitted = await this.prisma.submission.count({
      where: { ...where, status: SubmissionStatus.SUBMITTED }
    });
    const filesValidated = await this.prisma.submission.count({
      where: { ...where, status: SubmissionStatus.VALIDATED }
    });
    const filesRejected = await this.prisma.submission.count({
      where: { ...where, status: SubmissionStatus.REJECTED }
    });
    const qualityValidationRate = (filesValidated + filesRejected) > 0 
      ? Math.round((filesValidated / (filesValidated + filesRejected)) * 100) 
      : 0;

    const quality: QualityKPIs = {
      filesSubmitted,
      filesValidated,
      filesRejected,
      validationRate: qualityValidationRate
    };

    // ── Pilotage KPIs ──
    // Zones couvertes (communes uniques avec au moins une soumission validée)
    const coveredZones = await this.prisma.submission.groupBy({
      by: ['commune'],
      where: { ...where, status: SubmissionStatus.VALIDATED },
      _count: { id: true }
    });

    // Alertes principales
    const alerts: { type: string; count: number; message: string }[] = [];
    if (filesSubmitted > 50) {
      alerts.push({ type: 'PENDING', count: filesSubmitted, message: 'Dossiers en attente de validation' });
    }
    if (qualityValidationRate < 70) {
      alerts.push({ type: 'QUALITY', count: filesRejected, message: 'Taux de validation faible' });
    }
    if (achievementPercent < 50) {
      alerts.push({ type: 'PERFORMANCE', count: achievementPercent, message: 'Objectif non atteint' });
    }

    // Score global (moyenne des indicateurs)
    const score = Math.round(
      (Math.min(achievementPercent, 100) + 
       qualityValidationRate + 
       (activeTodayWorkforce > 0 ? 100 : 0)) / 3
    );

    const pilotage: PilotageKPIs = {
      coveredZones: coveredZones.length,
      mainAlerts: alerts,
      globalScore: score
    };

    const result: ComprehensiveKPIs = {
      production,
      performance,
      quality,
      pilotage
    };

    // Mise en cache pour 5 min
    await this.cache.set(cacheKey, result);

    return result;
  }

  // ──────────────────────────────────────────────
  //  Méthodes utilitaires privées
  // ──────────────────────────────────────────────

  /**
   * Valide les champs obligatoires selon le type de soumission.
   */
  private validateFieldsByType(dto: CreateSubmissionDto) {
    if (dto.type === SubmissionType.PROSPECT) {
      if (!dto.prospectFullName) {
        throw new BadRequestException('Le nom du prospect est obligatoire');
      }
      if (!dto.prospectPhone) {
        throw new BadRequestException(
          'Le téléphone du prospect est obligatoire',
        );
      }
      if (!dto.prospectProfession) {
        throw new BadRequestException(
          'La profession du prospect est obligatoire',
        );
      }
    }

    if (dto.type === SubmissionType.MARCHAND) {
      if (!dto.merchantName) {
        throw new BadRequestException('Le nom du commerce est obligatoire');
      }
      if (!dto.merchantOwner) {
        throw new BadRequestException(
          'Le nom du propriétaire est obligatoire',
        );
      }
      if (!dto.merchantPhone) {
        throw new BadRequestException(
          'Le téléphone du marchand est obligatoire',
        );
      }
    }
  }

  /**
   * Valide que les photos obligatoires sont présentes selon le type.
   * Prospect : 2 photos (APP_SCREEN + ID_DOCUMENT)
   * Marchand : 3 photos (STOREFRONT + QR_CODE + ID_DOCUMENT)
   */
  private validatePhotosByType(dto: CreateSubmissionDto) {
    const photos = dto.photos || [];
    const categories = photos.map((p) => p.category);

    // Pas de photos obligatoires pour les prospects

    if (dto.type === SubmissionType.MARCHAND) {
      if (!categories.includes('STOREFRONT')) {
        throw new BadRequestException(
          'Photo façade (STOREFRONT) obligatoire pour un marchand',
        );
      }
      if (!categories.includes('QR_CODE')) {
        throw new BadRequestException(
          'Photo QR code (QR_CODE) obligatoire pour un marchand',
        );
      }
      if (!categories.includes('ID_DOCUMENT')) {
        throw new BadRequestException(
          'Photo CNI (ID_DOCUMENT) obligatoire pour un marchand',
        );
      }
    }
  }

  /**
   * Vérifie que l'utilisateur a le droit de voir la soumission.
   */
  private checkAccessToSubmission(
    submission: { commercialId?: string; clusterId?: string | null },
    user: Omit<User, 'password'>,
  ) {
    if (user.role === Role.ADMIN) return;

    if (user.role === Role.COMMERCIAL) {
      if (submission.commercialId !== user.id) {
        throw new ForbiddenException('Accès refusé à cette soumission');
      }
    }

    if (user.role === Role.COORDINATEUR) return; // compte global

    if (user.role === Role.SUPERVISEUR) {
      if (submission.clusterId !== user.clusterId) {
        throw new ForbiddenException('Accès refusé à cette soumission');
      }
    }
  }
}
