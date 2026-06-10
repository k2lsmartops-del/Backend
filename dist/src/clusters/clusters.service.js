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
exports.ClustersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ClustersService = class ClustersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.cluster.findUnique({ where: { name: dto.name } });
        if (existing) {
            throw new common_1.ConflictException('Un cluster avec ce nom existe déjà');
        }
        if (dto.supervisorId) {
            await this.validateSupervisor(dto.supervisorId);
        }
        if (dto.communeIds && dto.communeIds.length > 0) {
            const taken = await this.prisma.commune.findMany({
                where: { id: { in: dto.communeIds }, clusterId: { not: null } },
                select: { name: true },
            });
            if (taken.length > 0) {
                throw new common_1.BadRequestException(`Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`);
            }
        }
        const cluster = await this.prisma.cluster.create({
            data: {
                name: dto.name,
                description: dto.description,
                supervisorId: dto.supervisorId || null,
            },
        });
        if (dto.supervisorId) {
            await this.prisma.user.update({
                where: { id: dto.supervisorId },
                data: { clusterId: cluster.id },
            });
        }
        if (dto.communeIds && dto.communeIds.length > 0) {
            await this.prisma.commune.updateMany({
                where: { id: { in: dto.communeIds } },
                data: { clusterId: cluster.id },
            });
        }
        return this.findOne(cluster.id);
    }
    async findAll() {
        return this.prisma.cluster.findMany({
            orderBy: { name: 'asc' },
            include: {
                supervisor: { select: { id: true, fullName: true, matricule: true, phone: true } },
                communes: { select: { id: true, name: true } },
                _count: { select: { members: true } },
            },
        });
    }
    async findAllFiltered(currentUser) {
        if (currentUser.role === client_1.Role.SUPERVISEUR && currentUser.clusterId) {
            return this.prisma.cluster.findMany({
                where: { id: currentUser.clusterId },
                orderBy: { name: 'asc' },
                include: {
                    supervisor: { select: { id: true, fullName: true, matricule: true, phone: true } },
                    communes: { select: { id: true, name: true } },
                    _count: { select: { members: true } },
                },
            });
        }
        return this.findAll();
    }
    async findOne(id) {
        const cluster = await this.prisma.cluster.findUnique({
            where: { id },
            include: {
                supervisor: { select: { id: true, fullName: true, matricule: true, phone: true } },
                communes: {
                    select: { id: true, name: true, _count: { select: { quartiers: true } } },
                    orderBy: { name: 'asc' },
                },
                members: {
                    select: { id: true, fullName: true, matricule: true, phone: true, role: true, isActive: true },
                    orderBy: { fullName: 'asc' },
                },
                _count: { select: { members: true } },
            },
        });
        if (!cluster)
            throw new common_1.NotFoundException('Cluster non trouvé');
        return cluster;
    }
    async update(id, dto) {
        const cluster = await this.prisma.cluster.findUnique({ where: { id } });
        if (!cluster)
            throw new common_1.NotFoundException('Cluster non trouvé');
        if (dto.name && dto.name !== cluster.name) {
            const dup = await this.prisma.cluster.findUnique({ where: { name: dto.name } });
            if (dup)
                throw new common_1.ConflictException('Un cluster avec ce nom existe déjà');
        }
        const supervisorId = dto.supervisorId === '' ? null : dto.supervisorId;
        if (supervisorId) {
            await this.validateSupervisor(supervisorId, id);
        }
        await this.prisma.cluster.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(supervisorId !== undefined && { supervisorId }),
            },
        });
        if (supervisorId !== undefined) {
            if (cluster.supervisorId && cluster.supervisorId !== supervisorId) {
                await this.prisma.user.update({
                    where: { id: cluster.supervisorId },
                    data: { clusterId: null },
                });
            }
            if (supervisorId) {
                await this.prisma.user.update({
                    where: { id: supervisorId },
                    data: { clusterId: id },
                });
            }
        }
        if (dto.communeIds !== undefined) {
            await this.prisma.commune.updateMany({
                where: { clusterId: id },
                data: { clusterId: null },
            });
            if (dto.communeIds.length > 0) {
                const taken = await this.prisma.commune.findMany({
                    where: { id: { in: dto.communeIds }, clusterId: { not: null } },
                    select: { name: true },
                });
                if (taken.length > 0) {
                    throw new common_1.BadRequestException(`Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`);
                }
                await this.prisma.commune.updateMany({
                    where: { id: { in: dto.communeIds } },
                    data: { clusterId: id },
                });
            }
        }
        return this.findOne(id);
    }
    async remove(id) {
        const cluster = await this.prisma.cluster.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                supervisorId: true,
                _count: { select: { members: true } },
            },
        });
        if (!cluster)
            throw new common_1.NotFoundException('Cluster non trouvé');
        if (cluster._count.members > 0) {
            throw new common_1.BadRequestException(`Impossible de supprimer ce cluster : il contient ${cluster._count.members} membre(s). ` +
                `Réaffectez-les d'abord.`);
        }
        if (cluster.supervisorId) {
            await this.prisma.user.update({
                where: { id: cluster.supervisorId },
                data: { clusterId: null },
            });
        }
        await this.prisma.commune.updateMany({
            where: { clusterId: id },
            data: { clusterId: null },
        });
        return this.prisma.cluster.delete({ where: { id } });
    }
    async validateSupervisor(supervisorId, excludeClusterId) {
        const user = await this.prisma.user.findUnique({ where: { id: supervisorId } });
        if (!user)
            throw new common_1.NotFoundException('Superviseur non trouvé');
        if (user.role !== client_1.Role.SUPERVISEUR) {
            throw new common_1.BadRequestException("L'utilisateur n'est pas un superviseur");
        }
        const otherCluster = await this.prisma.cluster.findFirst({
            where: {
                supervisorId,
                ...(excludeClusterId ? { id: { not: excludeClusterId } } : {}),
            },
        });
        if (otherCluster) {
            throw new common_1.BadRequestException(`Ce superviseur est déjà affecté au cluster "${otherCluster.name}"`);
        }
    }
};
exports.ClustersService = ClustersService;
exports.ClustersService = ClustersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClustersService);
//# sourceMappingURL=clusters.service.js.map