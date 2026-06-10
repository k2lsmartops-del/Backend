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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SubmissionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
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
    sponsorCode: true,
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
    validatedAt: true,
    validationComment: true,
    commercial: { select: { id: true, fullName: true, matricule: true } },
    validator: { select: { id: true, fullName: true, matricule: true } },
    photos: { select: { id: true, url: true, category: true } },
    clusterId: true,
};
let SubmissionsService = SubmissionsService_1 = class SubmissionsService {
    prisma;
    cache;
    logger = new common_1.Logger(SubmissionsService_1.name);
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
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
        let communeId = null;
        let communeName = dto.commune || '';
        let quartierId = null;
        let quartierName = dto.quartier || null;
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
                prospectFullName: dto.prospectFullName || null,
                prospectPhone: dto.prospectPhone || null,
                prospectProfession: dto.prospectProfession || null,
                prospectGender: dto.prospectGender || null,
                prospectAge: dto.prospectAge || null,
                appStatus: dto.appStatus || null,
                sponsorCode: dto.sponsorCode || null,
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
        const { type, status, clusterId, commercialId, commune, search, } = query;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const skip = (page - 1) * limit;
        const where = {};
        switch (user.role) {
            case client_1.Role.COMMERCIAL:
                where.commercialId = user.id;
                break;
            case client_1.Role.SUPERVISEUR:
                where.clusterId = user.clusterId;
                where.status = { notIn: [client_1.SubmissionStatus.DRAFT] };
                break;
            case client_1.Role.COORDINATEUR:
            case client_1.Role.ADMIN:
                break;
            default:
                where.commercialId = user.id;
        }
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (clusterId)
            where.clusterId = clusterId;
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
    async validate(id, user, comment) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.status !== client_1.SubmissionStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Cette soumission ne peut pas être validée (statut actuel : ' +
                submission.status +
                ')');
        }
        return this.prisma.submission.update({
            where: { id },
            data: {
                status: client_1.SubmissionStatus.VALIDATED,
                validatorId: user.id,
                validatedAt: new Date(),
                validationComment: comment || null,
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
    async reject(id, user, comment) {
        const submission = await this.prisma.submission.findUnique({
            where: { id },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Soumission non trouvée');
        }
        if (submission.status !== client_1.SubmissionStatus.SUBMITTED) {
            throw new common_1.BadRequestException('Cette soumission ne peut pas être rejetée (statut actuel : ' +
                submission.status +
                ')');
        }
        return this.prisma.submission.update({
            where: { id },
            data: {
                status: client_1.SubmissionStatus.REJECTED,
                validatorId: user.id,
                validatedAt: new Date(),
                validationComment: comment,
                validationHistory: {
                    create: {
                        actorId: user.id,
                        action: client_1.ValidationAction.REJECTED,
                        comment,
                    },
                },
            },
            select: SUBMISSION_SELECT,
        });
    }
    async getStats(user, clusterId) {
        const cacheKey = `dashboard:stats:${user.role}:${user.id}:${clusterId || 'all'}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            this.logger.debug(`KPIs servis depuis le cache (${cacheKey})`);
            return cached;
        }
        this.logger.debug(`KPIs recalculés — COUNT en base (${cacheKey})`);
        let effectiveClusterId;
        if ((user.role === client_1.Role.COORDINATEUR || user.role === client_1.Role.ADMIN) && clusterId) {
            effectiveClusterId = clusterId;
        }
        else if (user.role === client_1.Role.SUPERVISEUR && user.clusterId) {
            effectiveClusterId = user.clusterId;
        }
        const where = {};
        if (effectiveClusterId) {
            where.clusterId = effectiveClusterId;
        }
        const [total, draft, submitted, validated, rejected, prospects, marchands,] = await Promise.all([
            this.prisma.submission.count({ where }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.DRAFT } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.SUBMITTED } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.VALIDATED } }),
            this.prisma.submission.count({ where: { ...where, status: client_1.SubmissionStatus.REJECTED } }),
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
        const result = {
            total,
            byStatus: {
                draft,
                submitted,
                validated,
                rejected,
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
            pending: submitted,
        };
        await this.cache.set(cacheKey, result);
        return result;
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
        if (user.role === client_1.Role.COORDINATEUR)
            return;
        if (user.role === client_1.Role.SUPERVISEUR) {
            if (submission.clusterId !== user.clusterId) {
                throw new common_1.ForbiddenException('Accès refusé à cette soumission');
            }
        }
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = SubmissionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], SubmissionsService);
//# sourceMappingURL=submissions.service.js.map