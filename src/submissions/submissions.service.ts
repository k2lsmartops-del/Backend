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
   */
  async create(dto: CreateSubmissionDto, user: Omit<User, 'password'>) {
    // Valide les champs obligatoires selon le type
    this.validateFieldsByType(dto);

    return this.prisma.submission.create({
      data: {
        type: dto.type,
        clientUuid: dto.clientUuid,
        status: SubmissionStatus.SUBMITTED,
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
        // Sync
        createdOffline: dto.createdOffline || false,
        syncStatus: dto.syncStatus || 'SYNCED',
        submittedAt: new Date(),
        // Historique
        validationHistory: {
          create: {
            actorId: user.id,
            action: ValidationAction.SUBMITTED,
          },
        },
      },
      select: SUBMISSION_SELECT,
    });
  }

  /**
   * Synchronisation batch — crée plusieurs soumissions.
   */
  async syncBatch(dtos: CreateSubmissionDto[], user: Omit<User, 'password'>) {
    const results: unknown[] = [];
    for (const dto of dtos) {
      const result = await this.create(dto, user);
      results.push(result);
    }
    return { synced: results.length, submissions: results };
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
      page = 1,
      limit = 20,
      type,
      status,
      zoneId,
      commercialId,
      commune,
      search,
    } = query;
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
    }

    if (dto.type === SubmissionType.MARCHAND) {
      if (!dto.merchantName) {
        throw new BadRequestException('Le nom du commerce est obligatoire');
      }
      if (!dto.merchantPhone) {
        throw new BadRequestException(
          'Le téléphone du marchand est obligatoire',
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
