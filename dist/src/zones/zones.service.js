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
exports.ZonesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ZonesService = class ZonesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.zone.findUnique({ where: { name: dto.name } });
        if (existing) {
            throw new common_1.ConflictException('Une zone avec ce nom existe déjà');
        }
        if (dto.coordinatorId) {
            await this.validateCoordinator(dto.coordinatorId);
        }
        if (dto.communeIds.length > 0) {
            const taken = await this.prisma.commune.findMany({
                where: { id: { in: dto.communeIds }, zoneId: { not: null } },
                select: { name: true },
            });
            if (taken.length > 0) {
                throw new common_1.BadRequestException(`Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`);
            }
        }
        const zone = await this.prisma.zone.create({
            data: {
                name: dto.name,
                description: dto.description,
                coordinatorId: dto.coordinatorId || null,
            },
        });
        if (dto.coordinatorId) {
            await this.prisma.user.update({
                where: { id: dto.coordinatorId },
                data: { zoneId: zone.id },
            });
        }
        if (dto.communeIds.length > 0) {
            await this.prisma.commune.updateMany({
                where: { id: { in: dto.communeIds } },
                data: { zoneId: zone.id },
            });
        }
        return this.findOne(zone.id);
    }
    async findAll() {
        return this.prisma.zone.findMany({
            orderBy: { name: 'asc' },
            include: {
                coordinator: { select: { id: true, fullName: true, matricule: true } },
                communes: { select: { id: true, name: true } },
                _count: { select: { secteurs: true, members: true } },
            },
        });
    }
    async findAllFiltered(currentUser) {
        const where = {};
        if (currentUser.role === client_1.Role.COORDINATEUR && currentUser.zoneId) {
            where.id = currentUser.zoneId;
        }
        return this.prisma.zone.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                coordinator: { select: { id: true, fullName: true, matricule: true } },
                communes: { select: { id: true, name: true } },
                _count: { select: { secteurs: true, members: true } },
            },
        });
    }
    async findOne(id) {
        const zone = await this.prisma.zone.findUnique({
            where: { id },
            include: {
                coordinator: { select: { id: true, fullName: true, matricule: true } },
                communes: {
                    select: { id: true, name: true, _count: { select: { quartiers: true } } },
                    orderBy: { name: 'asc' },
                },
                secteurs: {
                    select: {
                        id: true,
                        name: true,
                        supervisor: { select: { id: true, fullName: true, matricule: true } },
                        _count: { select: { quartiers: true, members: true } },
                    },
                    orderBy: { name: 'asc' },
                },
                _count: { select: { members: true } },
            },
        });
        if (!zone)
            throw new common_1.NotFoundException('Zone non trouvée');
        return zone;
    }
    async update(id, dto) {
        const zone = await this.prisma.zone.findUnique({ where: { id } });
        if (!zone)
            throw new common_1.NotFoundException('Zone non trouvée');
        if (dto.name && dto.name !== zone.name) {
            const dup = await this.prisma.zone.findUnique({ where: { name: dto.name } });
            if (dup)
                throw new common_1.ConflictException('Une zone avec ce nom existe déjà');
        }
        const coordinatorId = dto.coordinatorId === '' ? null : dto.coordinatorId;
        if (coordinatorId) {
            await this.validateCoordinator(coordinatorId, id);
        }
        await this.prisma.zone.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(coordinatorId !== undefined && { coordinatorId }),
            },
        });
        if (coordinatorId !== undefined) {
            if (zone.coordinatorId && zone.coordinatorId !== coordinatorId) {
                await this.prisma.user.update({
                    where: { id: zone.coordinatorId },
                    data: { zoneId: null },
                });
            }
            if (coordinatorId) {
                await this.prisma.user.update({
                    where: { id: coordinatorId },
                    data: { zoneId: id },
                });
            }
        }
        if (dto.communeIds !== undefined) {
            const currentCommunes = await this.prisma.commune.findMany({
                where: { zoneId: id },
                select: { id: true, name: true },
            });
            const currentCommuneIds = currentCommunes.map((c) => c.id);
            const removedCommuneIds = currentCommuneIds.filter((cid) => !dto.communeIds.includes(cid));
            if (removedCommuneIds.length > 0) {
                const blockedSecteurs = await this.prisma.secteur.findMany({
                    where: {
                        zoneId: id,
                        quartiers: {
                            some: { communeId: { in: removedCommuneIds } },
                        },
                    },
                    select: {
                        name: true,
                        quartiers: {
                            where: { communeId: { in: removedCommuneIds } },
                            select: { communeId: true },
                        },
                    },
                });
                if (blockedSecteurs.length > 0) {
                    const removedCommuneNames = currentCommunes
                        .filter((c) => removedCommuneIds.includes(c.id))
                        .map((c) => c.name);
                    const details = blockedSecteurs
                        .map((s) => `${s.name} (${s.quartiers.length} quartier(s))`)
                        .join(', ');
                    throw new common_1.BadRequestException(`Impossible de retirer ${removedCommuneNames.join(', ')}. ` +
                        `Secteurs concernés : ${details}. ` +
                        `Modifiez ou supprimez ces secteurs d'abord.`);
                }
            }
            await this.prisma.commune.updateMany({
                where: { zoneId: id },
                data: { zoneId: null },
            });
            if (dto.communeIds.length > 0) {
                const taken = await this.prisma.commune.findMany({
                    where: { id: { in: dto.communeIds }, zoneId: { not: null } },
                    select: { name: true },
                });
                if (taken.length > 0) {
                    throw new common_1.BadRequestException(`Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`);
                }
                await this.prisma.commune.updateMany({
                    where: { id: { in: dto.communeIds } },
                    data: { zoneId: id },
                });
            }
        }
        return this.findOne(id);
    }
    async remove(id) {
        const zone = await this.prisma.zone.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                coordinatorId: true,
                _count: { select: { secteurs: true } },
            },
        });
        if (!zone)
            throw new common_1.NotFoundException('Zone non trouvée');
        if (zone._count.secteurs > 0) {
            throw new common_1.BadRequestException(`Impossible de supprimer cette zone : elle contient ${zone._count.secteurs} secteur(s). ` +
                `Supprimez-les d'abord.`);
        }
        if (zone.coordinatorId) {
            await this.prisma.user.update({
                where: { id: zone.coordinatorId },
                data: { zoneId: null },
            });
        }
        await this.prisma.commune.updateMany({
            where: { zoneId: id },
            data: { zoneId: null },
        });
        return this.prisma.zone.delete({ where: { id } });
    }
    async getQuartiersDisponibles(zoneId) {
        const zone = await this.prisma.zone.findUnique({
            where: { id: zoneId },
            include: { communes: { select: { id: true } } },
        });
        if (!zone)
            throw new common_1.NotFoundException('Zone non trouvée');
        const communeIds = zone.communes.map((c) => c.id);
        return this.prisma.quartier.findMany({
            where: {
                communeId: { in: communeIds },
                secteurId: null,
            },
            orderBy: { name: 'asc' },
            include: { commune: { select: { id: true, name: true } } },
        });
    }
    async validateCoordinator(coordinatorId, excludeZoneId) {
        const user = await this.prisma.user.findUnique({ where: { id: coordinatorId } });
        if (!user)
            throw new common_1.NotFoundException('Coordinateur non trouvé');
        if (user.role !== client_1.Role.COORDINATEUR) {
            throw new common_1.BadRequestException("L'utilisateur n'est pas un coordinateur");
        }
        const otherZone = await this.prisma.zone.findFirst({
            where: {
                coordinatorId,
                ...(excludeZoneId ? { id: { not: excludeZoneId } } : {}),
            },
        });
        if (otherZone) {
            throw new common_1.BadRequestException(`Ce coordinateur est déjà affecté à la zone "${otherZone.name}"`);
        }
    }
};
exports.ZonesService = ZonesService;
exports.ZonesService = ZonesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ZonesService);
//# sourceMappingURL=zones.service.js.map