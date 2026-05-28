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
exports.SecteursService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let SecteursService = class SecteursService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const zone = await this.prisma.zone.findUnique({
            where: { id: dto.zoneId },
        });
        if (!zone)
            throw new common_1.NotFoundException('Zone non trouvée');
        const dup = await this.prisma.secteur.findUnique({
            where: { name_zoneId: { name: dto.name, zoneId: dto.zoneId } },
        });
        if (dup)
            throw new common_1.BadRequestException('Un secteur avec ce nom existe déjà dans cette zone');
        if (dto.supervisorId) {
            await this.validateSupervisor(dto.supervisorId);
        }
        if (dto.quartierIds.length > 0) {
            await this.validateQuartiers(dto.quartierIds, dto.zoneId);
        }
        const secteur = await this.prisma.secteur.create({
            data: {
                name: dto.name,
                zoneId: dto.zoneId,
                supervisorId: dto.supervisorId || null,
            },
        });
        if (dto.supervisorId) {
            await this.prisma.user.update({
                where: { id: dto.supervisorId },
                data: { secteurId: secteur.id, zoneId: dto.zoneId },
            });
        }
        if (dto.quartierIds.length > 0) {
            await this.prisma.quartier.updateMany({
                where: { id: { in: dto.quartierIds } },
                data: { secteurId: secteur.id },
            });
        }
        return this.findOne(secteur.id);
    }
    async findAll(zoneId) {
        return this.prisma.secteur.findMany({
            where: zoneId ? { zoneId } : undefined,
            orderBy: { name: 'asc' },
            include: {
                zone: { select: { id: true, name: true } },
                supervisor: { select: { id: true, fullName: true, matricule: true } },
                _count: { select: { quartiers: true, members: true } },
            },
        });
    }
    async findAllFiltered(currentUser, zoneId) {
        const where = {};
        switch (currentUser.role) {
            case client_1.Role.COORDINATEUR:
                where.zoneId = currentUser.zoneId;
                break;
            case client_1.Role.SUPERVISEUR:
                where.id = currentUser.secteurId;
                break;
            default:
                if (zoneId)
                    where.zoneId = zoneId;
                break;
        }
        return this.prisma.secteur.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                zone: { select: { id: true, name: true } },
                supervisor: { select: { id: true, fullName: true, matricule: true } },
                _count: { select: { quartiers: true, members: true } },
            },
        });
    }
    async findOne(id) {
        const secteur = await this.prisma.secteur.findUnique({
            where: { id },
            include: {
                zone: { select: { id: true, name: true } },
                supervisor: { select: { id: true, fullName: true, matricule: true } },
                quartiers: {
                    orderBy: { name: 'asc' },
                    include: { commune: { select: { id: true, name: true } } },
                },
                members: {
                    select: { id: true, fullName: true, matricule: true, isActive: true },
                },
                _count: { select: { quartiers: true, members: true } },
            },
        });
        if (!secteur)
            throw new common_1.NotFoundException('Secteur non trouvé');
        return secteur;
    }
    async update(id, dto) {
        const secteur = await this.prisma.secteur.findUnique({ where: { id } });
        if (!secteur)
            throw new common_1.NotFoundException('Secteur non trouvé');
        if (dto.name && dto.name !== secteur.name) {
            const dup = await this.prisma.secteur.findUnique({
                where: { name_zoneId: { name: dto.name, zoneId: secteur.zoneId } },
            });
            if (dup)
                throw new common_1.BadRequestException('Un secteur avec ce nom existe déjà dans cette zone');
        }
        const supervisorId = dto.supervisorId === '' ? null : dto.supervisorId;
        if (supervisorId) {
            await this.validateSupervisor(supervisorId, id);
        }
        await this.prisma.secteur.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(supervisorId !== undefined && { supervisorId }),
            },
        });
        if (supervisorId !== undefined) {
            if (secteur.supervisorId && secteur.supervisorId !== supervisorId) {
                await this.prisma.user.update({
                    where: { id: secteur.supervisorId },
                    data: { secteurId: null, zoneId: null },
                });
            }
            if (supervisorId) {
                await this.prisma.user.update({
                    where: { id: supervisorId },
                    data: { secteurId: id, zoneId: secteur.zoneId },
                });
            }
        }
        if (dto.quartierIds !== undefined) {
            await this.prisma.quartier.updateMany({
                where: { secteurId: id },
                data: { secteurId: null },
            });
            if (dto.quartierIds.length > 0) {
                await this.validateQuartiers(dto.quartierIds, secteur.zoneId);
                await this.prisma.quartier.updateMany({
                    where: { id: { in: dto.quartierIds } },
                    data: { secteurId: id },
                });
            }
        }
        return this.findOne(id);
    }
    async remove(id) {
        const secteur = await this.prisma.secteur.findUnique({
            where: { id },
            select: { id: true, supervisorId: true },
        });
        if (!secteur)
            throw new common_1.NotFoundException('Secteur non trouvé');
        const activeCommerciaux = await this.prisma.user.count({
            where: {
                secteurId: id,
                role: client_1.Role.COMMERCIAL,
                isActive: true,
            },
        });
        if (activeCommerciaux > 0) {
            throw new common_1.BadRequestException(`Impossible de supprimer ce secteur : ${activeCommerciaux} commercial(aux) actif(s) y sont rattachés. ` +
                `Réaffectez-les ou désactivez-les d'abord.`);
        }
        if (secteur.supervisorId) {
            await this.prisma.user.update({
                where: { id: secteur.supervisorId },
                data: { secteurId: null, zoneId: null },
            });
        }
        await this.prisma.quartier.updateMany({
            where: { secteurId: id },
            data: { secteurId: null },
        });
        return this.prisma.secteur.delete({ where: { id } });
    }
    async validateSupervisor(supervisorId, excludeSecteurId) {
        const user = await this.prisma.user.findUnique({
            where: { id: supervisorId },
        });
        if (!user)
            throw new common_1.NotFoundException('Superviseur non trouvé');
        if (user.role !== client_1.Role.SUPERVISEUR) {
            throw new common_1.BadRequestException("L'utilisateur n'est pas un superviseur");
        }
        const otherSecteur = await this.prisma.secteur.findFirst({
            where: {
                supervisorId,
                ...(excludeSecteurId ? { id: { not: excludeSecteurId } } : {}),
            },
        });
        if (otherSecteur) {
            throw new common_1.BadRequestException(`Ce superviseur est déjà affecté au secteur "${otherSecteur.name}"`);
        }
    }
    async validateQuartiers(quartierIds, zoneId) {
        const zone = await this.prisma.zone.findUnique({
            where: { id: zoneId },
            include: { communes: { select: { id: true } } },
        });
        if (!zone)
            throw new common_1.NotFoundException('Zone non trouvée');
        const communeIds = zone.communes.map((c) => c.id);
        const quartiers = await this.prisma.quartier.findMany({
            where: { id: { in: quartierIds } },
            select: { id: true, name: true, communeId: true, secteurId: true },
        });
        if (quartiers.length !== quartierIds.length) {
            throw new common_1.BadRequestException('Certains quartiers sont introuvables');
        }
        const outsideZone = quartiers.filter((q) => !communeIds.includes(q.communeId));
        if (outsideZone.length > 0) {
            throw new common_1.BadRequestException(`Quartiers hors de la zone : ${outsideZone.map((q) => q.name).join(', ')}`);
        }
        const taken = quartiers.filter((q) => q.secteurId !== null);
        if (taken.length > 0) {
            throw new common_1.BadRequestException(`Quartiers déjà affectés : ${taken.map((q) => q.name).join(', ')}`);
        }
    }
};
exports.SecteursService = SecteursService;
exports.SecteursService = SecteursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SecteursService);
//# sourceMappingURL=secteurs.service.js.map