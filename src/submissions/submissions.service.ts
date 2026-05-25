import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
  phoneType: true,
  bankAccount: true,
  observations: true,
  // Champs marchand
  merchantName: true,
  merchantOwner: true,
  merchantPhone: true,
  merchantActivity: true,
  merchantRccm: true,
  // Sync
  syncStatus: true,
  createdOffline: true,
  // Dates
  createdAt: true,
  submittedAt: true,
  updatedAt: true,
  // Validation
  level1At: true,
  level1Comment: true,
  level2At: true,
  level2Comment: true,
  // Relations
  commercial: { select: { id: true, fullName: true, matricule: true } },
  level1Validator: { select: { id: true, fullName: true, matricule: true } },
  level2Validator: { select: { id: true, fullName: true, matricule: true } },
  photos: { select: { id: true, url: true, category: true } },
  zoneId: true,
};

/**
 * Service de gestion des soumissions terrain.
 * Gère création, soumission, listing, validation N1/N2, rejet.
 */
@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée une soumission (brouillon ou directement soumise).
   * Appelé par le COMMERCIAL.
   *
   * Idempotence : si clientUuid existe déjà → retourne l'existante.
   * Doublon prospect : si prospectPhone existe déjà → signale sans bloquer.
   */
  async create(dto: CreateSubmissionDto, user: Omit<User, 'password'>) {
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

    const submission = await this.prisma.submission.create({
      data: {
        type: dto.type,
        clientUuid: dto.clientUuid,
        status: targetStatus,
        commercialId: user.id,
        zoneId: user.zoneId || null,
        commune: dto.commune,
        quartier: dto.quartier || null,
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
        phoneType: dto.phoneType || null,
        bankAccount: dto.bankAccount || null,
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
   *  - SUPERVISEUR : voit les soumissions de sa zone (status >= SUBMITTED)
   *  - COORDINATEUR : voit les soumissions de sa zone (status >= SUPERVISOR_APPROVED)
   *  - ADMIN : voit tout
   */
  async findAll(query: QuerySubmissionsDto, user: Omit<User, 'password'>) {
    const {
      type,
      status,
      zoneId,
      commercialId,
      commune,
      search,
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
        where.zoneId = user.zoneId;
        where.status = { notIn: [SubmissionStatus.DRAFT] };
        break;
      case Role.COORDINATEUR:
        where.zoneId = user.zoneId;
        where.status = {
          notIn: [SubmissionStatus.DRAFT, SubmissionStatus.SUBMITTED],
        };
        break;
      case Role.ADMIN:
        // Pas de restriction
        break;
      default:
        where.commercialId = user.id;
    }

    // Filtres optionnels
    if (type) where.type = type;
    if (status) where.status = status;
    if (zoneId) where.zoneId = zoneId;
    if (commercialId) where.commercialId = commercialId;
    if (commune) where.commune = commune;

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
   * Validation NIVEAU 1 par le SUPERVISEUR.
   * Passe de SUBMITTED → SUPERVISOR_APPROVED.
   */
  async approveLevel1(
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
        'Cette soumission ne peut pas être validée niveau 1 (statut actuel : ' +
          submission.status +
          ')',
      );
    }

    // Vérifie que le superviseur est dans la même zone
    if (user.role !== Role.ADMIN && submission.zoneId !== user.zoneId) {
      throw new ForbiddenException(
        'Vous ne pouvez valider que les soumissions de votre zone',
      );
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.SUPERVISOR_APPROVED,
        level1ValidatorId: user.id,
        level1At: new Date(),
        level1Comment: comment || null,
        validationHistory: {
          create: {
            actorId: user.id,
            action: ValidationAction.SUPERVISOR_APPROVED,
            comment: comment || null,
          },
        },
      },
      select: SUBMISSION_SELECT,
    });
  }

  /**
   * Validation NIVEAU 2 par le COORDINATEUR.
   * Passe de SUPERVISOR_APPROVED → VALIDATED.
   */
  async approveLevel2(
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

    if (submission.status !== SubmissionStatus.SUPERVISOR_APPROVED) {
      throw new BadRequestException(
        'Cette soumission ne peut pas être validée niveau 2 (statut actuel : ' +
          submission.status +
          ')',
      );
    }

    // Vérifie que le coordinateur est dans la même zone
    if (user.role !== Role.ADMIN && submission.zoneId !== user.zoneId) {
      throw new ForbiddenException(
        'Vous ne pouvez valider que les soumissions de votre zone',
      );
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.VALIDATED,
        level2ValidatorId: user.id,
        level2At: new Date(),
        level2Comment: comment || null,
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
   * Rejet NIVEAU 1 par le SUPERVISEUR.
   */
  async rejectLevel1(
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
        'Cette soumission ne peut pas être rejetée au niveau 1',
      );
    }

    if (user.role !== Role.ADMIN && submission.zoneId !== user.zoneId) {
      throw new ForbiddenException(
        'Vous ne pouvez rejeter que les soumissions de votre zone',
      );
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED_L1,
        level1ValidatorId: user.id,
        level1At: new Date(),
        level1Comment: comment,
        validationHistory: {
          create: {
            actorId: user.id,
            action: ValidationAction.REJECTED_L1,
            comment,
          },
        },
      },
      select: SUBMISSION_SELECT,
    });
  }

  /**
   * Rejet NIVEAU 2 par le COORDINATEUR.
   */
  async rejectLevel2(
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

    if (submission.status !== SubmissionStatus.SUPERVISOR_APPROVED) {
      throw new BadRequestException(
        'Cette soumission ne peut pas être rejetée au niveau 2',
      );
    }

    if (user.role !== Role.ADMIN && submission.zoneId !== user.zoneId) {
      throw new ForbiddenException(
        'Vous ne pouvez rejeter que les soumissions de votre zone',
      );
    }

    return this.prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED_L2,
        level2ValidatorId: user.id,
        level2At: new Date(),
        level2Comment: comment,
        validationHistory: {
          create: {
            actorId: user.id,
            action: ValidationAction.REJECTED_L2,
            comment,
          },
        },
      },
      select: SUBMISSION_SELECT,
    });
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

    if (dto.type === SubmissionType.PROSPECT) {
      if (!categories.includes('APP_SCREEN')) {
        throw new BadRequestException(
          'Photo écran app (APP_SCREEN) obligatoire pour un prospect',
        );
      }
      if (!categories.includes('ID_DOCUMENT')) {
        throw new BadRequestException(
          'Photo CNI (ID_DOCUMENT) obligatoire pour un prospect',
        );
      }
    }

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
    submission: { commercialId?: string; zoneId?: string | null },
    user: Omit<User, 'password'>,
  ) {
    if (user.role === Role.ADMIN) return;

    if (user.role === Role.COMMERCIAL) {
      if (submission.commercialId !== user.id) {
        throw new ForbiddenException('Accès refusé à cette soumission');
      }
    }

    if (user.role === Role.SUPERVISEUR || user.role === Role.COORDINATEUR) {
      if (submission.zoneId !== user.zoneId) {
        throw new ForbiddenException('Accès refusé à cette soumission');
      }
    }
  }
}
