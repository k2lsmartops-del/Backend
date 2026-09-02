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
    commercial: { select: { id: true, fullName: true, matricule: true, sponsorCode: true } },
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
        if (user.role === client_1.Role.COMMERCIAL) {
            const commercial = await this.prisma.user.findUnique({
                where: { id: user.id },
                select: { sponsorCode: true },
            });
            if (!commercial || !commercial.sponsorCode) {
                throw new common_1.BadRequestException('Vous devez avoir un code de parrainage pour effectuer des soumissions. Contactez votre superviseur.');
            }
            if (!dto.sponsorCode) {
                dto.sponsorCode = commercial.sponsorCode;
            }
        }
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
                this.logger.error(`Sync échouée clientUuid=${dto.clientUuid} commercialId=${user.id}: ${message}`, err instanceof Error ? err.stack : undefined);
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
        const { type, status, clusterId, commercialId, commune, search, startDate, endDate, period, } = query;
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
            case client_1.Role.CLIENT:
                where.status = client_1.SubmissionStatus.VALIDATED;
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
        if (period) {
            const now = new Date();
            if (period === 'day') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                where.createdAt = { gte: today };
            }
            else if (period === 'week') {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                weekStart.setHours(0, 0, 0, 0);
                where.createdAt = { gte: weekStart };
            }
            else if (period === 'month') {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                where.createdAt = { gte: monthStart };
            }
        }
        else if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = startDate;
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                where.createdAt.lte = endOfDay;
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
    async getStats(user, clusterId, period = 'day') {
        const cacheKey = `dashboard:stats:${user.role}:${user.id}:${clusterId || 'all'}:${period}`;
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
        if (user.role === client_1.Role.CLIENT) {
            where.status = client_1.SubmissionStatus.VALIDATED;
        }
        const now = new Date();
        if (period === 'day') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            where.createdAt = { gte: today };
        }
        else if (period === 'week') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            where.createdAt = { gte: weekStart };
        }
        else if (period === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            where.createdAt = { gte: monthStart };
        }
        const plannedWorkforce = 135;
        const recruitedWorkforce = await this.prisma.user.count({
            where: {
                role: client_1.Role.COMMERCIAL,
                isActive: true,
                ...(effectiveClusterId && { clusterId: effectiveClusterId })
            }
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let activeTodayWorkforce = 0;
        if (period === 'day') {
            const activeCommercials = await this.prisma.submission.groupBy({
                by: ['commercialId'],
                where: {
                    createdAt: { gte: today },
                    ...(effectiveClusterId && { clusterId: effectiveClusterId })
                }
            });
            activeTodayWorkforce = activeCommercials.length;
        }
        else if (period === 'week') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const submissions = await this.prisma.submission.findMany({
                where: {
                    createdAt: { gte: weekStart },
                    ...(effectiveClusterId && { clusterId: effectiveClusterId })
                },
                select: { commercialId: true, createdAt: true }
            });
            const commercialDays = new Map();
            for (const sub of submissions) {
                const dayKey = sub.createdAt.toISOString().split('T')[0];
                if (!commercialDays.has(sub.commercialId)) {
                    commercialDays.set(sub.commercialId, new Set());
                }
                commercialDays.get(sub.commercialId).add(dayKey);
            }
            activeTodayWorkforce = Array.from(commercialDays.values()).filter(days => days.size >= 6).length;
        }
        else if (period === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const submissions = await this.prisma.submission.findMany({
                where: {
                    createdAt: { gte: monthStart },
                    ...(effectiveClusterId && { clusterId: effectiveClusterId })
                },
                select: { commercialId: true, createdAt: true }
            });
            const commercialDays = new Map();
            for (const sub of submissions) {
                const dayKey = sub.createdAt.toISOString().split('T')[0];
                if (!commercialDays.has(sub.commercialId)) {
                    commercialDays.set(sub.commercialId, new Set());
                }
                commercialDays.get(sub.commercialId).add(dayKey);
            }
            activeTodayWorkforce = Array.from(commercialDays.values()).filter(days => days.size >= 24).length;
        }
        const installations = await this.prisma.submission.count({
            where: {
                ...where,
                type: client_1.SubmissionType.PROSPECT,
                status: client_1.SubmissionStatus.VALIDATED,
                appStatus: { in: ['INSTALLED', 'INSTALLED_ACTIVATED'] }
            }
        });
        const activations = await this.prisma.submission.count({
            where: {
                ...where,
                type: client_1.SubmissionType.PROSPECT,
                status: client_1.SubmissionStatus.VALIDATED,
                appStatus: 'INSTALLED_ACTIVATED'
            }
        });
        const clientsApproached = await this.prisma.submission.count({
            where: { ...where }
        });
        const activationRate = installations > 0
            ? Math.round((activations / installations) * 1000) / 10
            : 0;
        const installationsPlusActivations = installations + activations;
        const production = {
            plannedWorkforce,
            recruitedWorkforce,
            activeTodayWorkforce,
            clientsApproached,
            installations,
            installationsPlusActivations,
            activationRate,
        };
        const quotaPerAgent = period === 'day' ? 12 : period === 'week' ? 84 : 360;
        const objective = activeTodayWorkforce * quotaPerAgent;
        const achieved = clientsApproached;
        const achievementPercent = objective > 0 ? Math.round((achieved / objective) * 100) : 0;
        const productivityPerAgent = activeTodayWorkforce > 0 ? Math.round(achieved / activeTodayWorkforce) : 0;
        const clusters = await this.prisma.cluster.findMany({
            where: effectiveClusterId ? { id: effectiveClusterId } : {},
            include: {
                _count: { select: { members: { where: { role: client_1.Role.COMMERCIAL, isActive: true } } } }
            }
        });
        const clusterPerformance = await Promise.all(clusters.map(async (cluster) => {
            const clusterWhere = { ...where, clusterId: cluster.id };
            const clusterAgents = cluster._count.members;
            const clusterObjective = clusterAgents * quotaPerAgent;
            const clusterAchieved = await this.prisma.submission.count({
                where: { ...clusterWhere, status: client_1.SubmissionStatus.VALIDATED }
            });
            return {
                clusterId: cluster.id,
                clusterName: cluster.name,
                achieved: clusterAchieved,
                objective: clusterObjective
            };
        }));
        const performance = {
            objective,
            achieved,
            achievementPercent,
            productivityPerAgent,
            clusterPerformance
        };
        const filesSubmitted = await this.prisma.submission.count({
            where: { ...where, status: client_1.SubmissionStatus.SUBMITTED }
        });
        const filesValidated = await this.prisma.submission.count({
            where: { ...where, status: client_1.SubmissionStatus.VALIDATED }
        });
        const filesRejected = await this.prisma.submission.count({
            where: { ...where, status: client_1.SubmissionStatus.REJECTED }
        });
        const qualityValidationRate = (filesValidated + filesRejected) > 0
            ? Math.round((filesValidated / (filesValidated + filesRejected)) * 100)
            : 0;
        const quality = {
            filesSubmitted,
            filesValidated,
            filesRejected,
            validationRate: qualityValidationRate
        };
        const coveredZones = await this.prisma.submission.groupBy({
            by: ['commune'],
            where: { ...where, status: client_1.SubmissionStatus.VALIDATED },
            _count: { id: true }
        });
        const alerts = [];
        if (filesSubmitted > 50) {
            alerts.push({ type: 'PENDING', count: filesSubmitted, message: 'Dossiers en attente de validation' });
        }
        if (qualityValidationRate < 70) {
            alerts.push({ type: 'QUALITY', count: filesRejected, message: 'Taux de validation faible' });
        }
        if (achievementPercent < 50) {
            alerts.push({ type: 'PERFORMANCE', count: achievementPercent, message: 'Objectif non atteint' });
        }
        const workforceRate = recruitedWorkforce > 0
            ? Math.min((activeTodayWorkforce / recruitedWorkforce) * 100, 100)
            : 0;
        const score = Math.round((Math.min(achievementPercent, 100) +
            qualityValidationRate +
            workforceRate) / 3);
        const pilotage = {
            coveredZones: coveredZones.length,
            mainAlerts: alerts,
            globalScore: score
        };
        const result = {
            production,
            performance,
            quality,
            pilotage
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