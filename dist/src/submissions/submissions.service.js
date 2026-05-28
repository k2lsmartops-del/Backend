"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
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
    prospectFullName: true,
    prospectPhone: true,
    prospectProfession: true,
    prospectGender: true,
    prospectAge: true,
    appStatus: true,
    phoneType: true,
    bankAccount: true,
    observations: true,
    merchantName: true,
    merchantOwner: true,
    merchantPhone: true,
    merchantActivity: true,
    merchantRccm: true,
    commercialId: true,
    syncStatus: true,
    createdOffline: true,
    createdAt: true,
    submittedAt: true,
    updatedAt: true,
    level1At: true,
    level1Comment: true,
    level2At: true,
    level2Comment: true,
    commercial: { select: { id: true, fullName: true, matricule: true } },
    level1Validator: { select: { id: true, fullName: true, matricule: true } },
    level2Validator: { select: { id: true, fullName: true, matricule: true } },
    photos: { select: { id: true, url: true, category: true } },
    zoneId: true,
};
let SubmissionsService = class SubmissionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, user) {
        const existing = await this.prisma.submission.findUnique({
            where: { clientUuid: dto.clientUuid },
            select: SUBMISSION_SELECT,
        });
        if (existing)
            return { ...existing, _idempotent: true };
        const isDraft = dto.requestedStatus === 'DRAFT';
        const targetStatus = isDraft
            ? client_1.SubmissionStatus.DRAFT
            : client_1.SubmissionStatus.SUBMITTED;
        if (!isDraft) {
            this.validateFieldsByType(dto);
            this.validatePhotosByType(dto);
        }
        let _duplicateWarning;
        if (dto.type === client_1.SubmissionType.PROSPECT &&
            dto.prospectPhone) {
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
                prospectFullName: dto.prospectFullName || null,
                prospectPhone: dto.prospectPhone || null,
                prospectProfession: dto.prospectProfession || null,
                prospectGender: dto.prospectGender || null,
                prospectAge: dto.prospectAge || null,
                appStatus: dto.appStatus || null,
                phoneType: dto.phoneType || null,
                bankAccount: dto.bankAccount || null,
                observations: dto.observations || null,
                merchantName: dto.merchantName || null,
                merchantOwner: dto.merchantOwner || null,
                merchantPhone: dto.merchantPhone || null,
                merchantActivity: dto.merchantActivity || null,
                merchantRccm: dto.merchantRccm || null,
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
                createdOffline: dto.createdOffline || false,
                syncStatus: dto.syncStatus || 'SYNCED',
                submittedAt: isDraft ? null : new Date(),
                validationHistory: isDraft
                    ? undefined
                    : {
                        create: {
                            actorId: user.id,
                            action: client_1.ValidationAction.SUBMITTED,
                        },
                    },
            },
            select: SUBMISSION_SELECT,
        });
        return { ...submission, _duplicateWarning };
    }
    async syncBatch(dtos, user) {
        const results = [];
        for (const dto of dtos) {
            try {
                const data = await this.create(dto, user);
                results.push({ clientUuid: dto.clientUuid, status: 'synced', data });
            }
            catch (err) {
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
    async findAll(query, user) {
        const { type, status, zoneId, commercialId, commune, search, } = query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {};
        switch (user.role) {
            case client_1.Role.COMMERCIAL:
                where.commercialId = user.id;
                break;
            case client_1.Role.SUPERVISEUR:
                where.zoneId = user.zoneId;
                where.status = { notIn: [client_1.SubmissionStatus.DRAFT] };
                break;
            case client_1.Role.COORDINATEUR:
                where.zoneId = user.zoneId;
                where.status = {
                    notIn: [client_1.SubmissionStatus.DRAFT, client_1.SubmissionStatus.SUBMITTED],
                };
                break;
            case client_1.Role.ADMIN:
                break;
            default:
                where.commercialId = user.id;
        }
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (zoneId)
            where.zoneId = zoneId;
        if (commercialId)
            where.commercialId = commercialId;
        if (commune)
            where.commune = commune;
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
    async findOne(id, user) {
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
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        this.checkAccessToSubmission(submission, user);
        return submission;
    }
    async update(id, dto, user) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
            select: { id: true, status: true, commercialId: true },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.commercialId !== user.id) {
            throw new common_1.ForbiddenException('Vous ne pouvez modifier que vos propres soumissions');
        }
        if (submission.status !== client_1.SubmissionStatus.DRAFT &&
            submission.status !== client_1.SubmissionStatus.SUBMITTED) {
            throw new common_1.BadRequestException(`Modification impossible : la soumission est au statut "${submission.status}". Elle a déjà été prise en charge.`);
        }
        const { photos, ...fields } = dto;
        const data = {
            ...fields,
            gpsCapturedAt: fields.gpsCapturedAt
                ? new Date(fields.gpsCapturedAt)
                : undefined,
        };
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
    async checkEditable(id, user) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
            select: { id: true, status: true, commercialId: true },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.commercialId !== user.id) {
            throw new common_1.ForbiddenException('Accès interdit');
        }
        const editable = submission.status === client_1.SubmissionStatus.DRAFT ||
            submission.status === client_1.SubmissionStatus.SUBMITTED;
        return { editable, status: submission.status };
    }
    async remove(id, user) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
            select: { id: true, status: true, commercialId: true },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.commercialId !== user.id) {
            throw new common_1.ForbiddenException('Vous ne pouvez supprimer que vos propres soumissions');
        }
        if (submission.status !== client_1.SubmissionStatus.DRAFT &&
            submission.status !== client_1.SubmissionStatus.SUBMITTED) {
            throw new common_1.BadRequestException(`Suppression impossible : la soumission est au statut "${submission.status}".`);
        }
        await this.prisma.submission.delete({ where: { id } });
        return { deleted: true };
    }
    async approveLevel1(id, user, comment) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.status !== client_1.SubmissionStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Cette soumission ne peut pas être validée niveau 1 (statut actuel : ' +
                submission.status +
                ')');
        }
        if (user.role !== client_1.Role.ADMIN && submission.zoneId !== user.zoneId) {
            throw new common_1.ForbiddenException('Vous ne pouvez valider que les soumissions de votre zone');
        }
        return this.prisma.submission.update({
            where: { id },
            data: {
                status: client_1.SubmissionStatus.SUPERVISOR_APPROVED,
                level1ValidatorId: user.id,
                level1At: new Date(),
                level1Comment: comment || null,
                validationHistory: {
                    create: {
                        actorId: user.id,
                        action: client_1.ValidationAction.SUPERVISOR_APPROVED,
                        comment: comment || null,
                    },
                },
            },
            select: SUBMISSION_SELECT,
        });
    }
    async approveLevel2(id, user, comment) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.status !== client_1.SubmissionStatus.SUPERVISOR_APPROVED) {
            throw new common_1.BadRequestException('Cette soumission ne peut pas être validée niveau 2 (statut actuel : ' +
                submission.status +
                ')');
        }
        if (user.role !== client_1.Role.ADMIN && submission.zoneId !== user.zoneId) {
            throw new common_1.ForbiddenException('Vous ne pouvez valider que les soumissions de votre zone');
        }
        return this.prisma.submission.update({
            where: { id },
            data: {
                status: client_1.SubmissionStatus.VALIDATED,
                level2ValidatorId: user.id,
                level2At: new Date(),
                level2Comment: comment || null,
                validationHistory: {
                    create: {
                        actorId: user.id,
                        action: client_1.ValidationAction.VALIDATED,
                        comment: comment || null,
                    },
                },
            },
            select: SUBMISSION_SELECT,
        });
    }
    async rejectLevel1(id, user, comment) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.status !== client_1.SubmissionStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Cette soumission ne peut pas être rejetée au niveau 1');
        }
        if (user.role !== client_1.Role.ADMIN && submission.zoneId !== user.zoneId) {
            throw new common_1.ForbiddenException('Vous ne pouvez rejeter que les soumissions de votre zone');
        }
        return this.prisma.submission.update({
            where: { id },
            data: {
                status: client_1.SubmissionStatus.REJECTED_L1,
                level1ValidatorId: user.id,
                level1At: new Date(),
                level1Comment: comment,
                validationHistory: {
                    create: {
                        actorId: user.id,
                        action: client_1.ValidationAction.REJECTED_L1,
                        comment,
                    },
                },
            },
            select: SUBMISSION_SELECT,
        });
    }
    async rejectLevel2(id, user, comment) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.status !== client_1.SubmissionStatus.SUPERVISOR_APPROVED) {
            throw new common_1.BadRequestException('Cette soumission ne peut pas être rejetée au niveau 2');
        }
        if (user.role !== client_1.Role.ADMIN && submission.zoneId !== user.zoneId) {
            throw new common_1.ForbiddenException('Vous ne pouvez rejeter que les soumissions de votre zone');
        }
        return this.prisma.submission.update({
            where: { id },
            data: {
                status: client_1.SubmissionStatus.REJECTED_L2,
                level2ValidatorId: user.id,
                level2At: new Date(),
                level2Comment: comment,
                validationHistory: {
                    create: {
                        actorId: user.id,
                        action: client_1.ValidationAction.REJECTED_L2,
                        comment,
                    },
                },
            },
            select: SUBMISSION_SELECT,
        });
    }
    async getStats(user, zoneId) {
        let effectiveZoneId;
        if (user.role === client_1.Role.COORDINATEUR) {
            effectiveZoneId = user.zoneId || undefined;
        }
        else if (user.role === client_1.Role.ADMIN && zoneId) {
            effectiveZoneId = zoneId;
        }
        const where = {};
        if (effectiveZoneId) {
            where.zoneId = effectiveZoneId;
        }
        const [total, draft, submitted, supervisorApproved, validated, rejectedL1, rejectedL2, prospects, marchands,] = await Promise.all([
            this.prisma.submission.count({ where }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.DRAFT } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.SUBMITTED } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.SUPERVISOR_APPROVED } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.VALIDATED } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.REJECTED_L1 } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.REJECTED_L2 } }),
            this.prisma.submission.count({ where: { ...where, type: client_1.SubmissionType.PROSPECT } }),
            this.prisma.submission.count({ where: { ...where, type: client_1.SubmissionType.MARCHAND } }),
        ]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayWhere = { ...where, createdAt: { gte: today } };
        const [todayTotal, todayValidated] = await Promise.all([
            this.prisma.submission.count({ where: todayWhere }),
            this.prisma.submission.count({ where: { ...todayWhere, status: client_1.SubmissionStatus.VALIDATED } }),
        ]);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekWhere = { ...where, createdAt: { gte: weekStart } };
        const [weekTotal, weekValidated] = await Promise.all([
            this.prisma.submission.count({ where: weekWhere }),
            this.prisma.submission.count({ where: { ...weekWhere, status: client_1.SubmissionStatus.VALIDATED } }),
        ]);
        const validationRate = total > 0 ? Math.round((validated / total) * 100) : 0;
        const pendingL1 = submitted;
        const pendingL2 = supervisorApproved;
        return {
            total,
            byStatus: {
                draft,
                submitted,
                supervisorApproved,
                validated,
                rejectedL1,
                rejectedL2,
            },
            byType: {
                prospects,
                marchands,
            },
            today: {
                total: todayTotal,
                validated: todayValidated,
            },
            week: {
                total: weekTotal,
                validated: weekValidated,
            },
            validationRate,
            pending: {
                level1: pendingL1,
                level2: pendingL2,
            },
        };
    }
    validateFieldsByType(dto) {
        if (dto.type === client_1.SubmissionType.PROSPECT) {
            if (!dto.prospectFullName) {
                throw new common_1.BadRequestException('Le nom du prospect est obligatoire');
            }
            if (!dto.prospectPhone) {
                throw new common_1.BadRequestException('Le téléphone du prospect est obligatoire');
            }
            if (!dto.prospectProfession) {
                throw new common_1.BadRequestException('La profession du prospect est obligatoire');
            }
        }
        if (dto.type === client_1.SubmissionType.MARCHAND) {
            if (!dto.merchantName) {
                throw new common_1.BadRequestException('Le nom du commerce est obligatoire');
            }
            if (!dto.merchantOwner) {
                throw new common_1.BadRequestException('Le nom du propriétaire est obligatoire');
            }
            if (!dto.merchantPhone) {
                throw new common_1.BadRequestException('Le téléphone du marchand est obligatoire');
            }
        }
    }
    validatePhotosByType(dto) {
        const photos = dto.photos || [];
        const categories = photos.map((p) => p.category);
        if (dto.type === client_1.SubmissionType.PROSPECT) {
            if (!categories.includes('APP_SCREEN')) {
                throw new common_1.BadRequestException('Photo écran app (APP_SCREEN) obligatoire pour un prospect');
            }
            if (!categories.includes('ID_DOCUMENT')) {
                throw new common_1.BadRequestException('Photo CNI (ID_DOCUMENT) obligatoire pour un prospect');
            }
        }
        if (dto.type === client_1.SubmissionType.MARCHAND) {
            if (!categories.includes('STOREFRONT')) {
                throw new common_1.BadRequestException('Photo façade (STOREFRONT) obligatoire pour un marchand');
            }
            if (!categories.includes('QR_CODE')) {
                throw new common_1.BadRequestException('Photo QR code (QR_CODE) obligatoire pour un marchand');
            }
            if (!categories.includes('ID_DOCUMENT')) {
                throw new common_1.BadRequestException('Photo CNI (ID_DOCUMENT) obligatoire pour un marchand');
            }
        }
    }
    checkAccessToSubmission(submission, user) {
        if (user.role === client_1.Role.ADMIN)
            return;
        if (user.role === client_1.Role.COMMERCIAL) {
            if (submission.commercialId !== user.id) {
                throw new common_1.ForbiddenException('Accès refusé à cette soumission');
            }
        }
        if (user.role === client_1.Role.SUPERVISEUR || user.role === client_1.Role.COORDINATEUR) {
            if (submission.zoneId !== user.zoneId) {
                throw new common_1.ForbiddenException('Accès refusé à cette soumission');
            }
        }
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubmissionsService);
//# sourceMappingURL=submissions.service.js.map