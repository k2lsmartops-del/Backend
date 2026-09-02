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
var ClustersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClustersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let ClustersService = ClustersService_1 = class ClustersService {
    prisma;
    logger = new common_1.Logger(ClustersService_1.name);
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
    async assignSupervisor(clusterId, newSupervisorId) {
        return this.prisma.$transaction(async (tx) => {
            const cluster = await tx.cluster.findUnique({
                where: { id: clusterId },
                select: { id: true, name: true, supervisorId: true },
            });
            if (!cluster) {
                throw new common_1.NotFoundException(`Cluster ${clusterId} introuvable`);
            }
            const newSup = await tx.user.findUnique({
                where: { id: newSupervisorId },
                select: { id: true, fullName: true, role: true, clusterId: true },
            });
            if (!newSup) {
                throw new common_1.NotFoundException(`Utilisateur ${newSupervisorId} introuvable`);
            }
            if (newSup.role !== client_1.Role.SUPERVISEUR) {
                throw new common_1.BadRequestException(`L'utilisateur ${newSup.fullName} n'est pas un SUPERVISEUR (rôle actuel : ${newSup.role})`);
            }
            const otherCluster = await tx.cluster.findFirst({
                where: { supervisorId: newSupervisorId, id: { not: clusterId } },
                select: { id: true, name: true },
            });
            if (otherCluster) {
                throw new common_1.ConflictException(`${newSup.fullName} dirige déjà ${otherCluster.name}. Libérez-le d'abord.`);
            }
            const ancienSupervisorId = cluster.supervisorId;
            await tx.cluster.update({
                where: { id: clusterId },
                data: { supervisorId: newSupervisorId },
            });
            await tx.user.update({
                where: { id: newSupervisorId },
                data: { clusterId: clusterId },
            });
            if (ancienSupervisorId && ancienSupervisorId !== newSupervisorId) {
                await tx.user.update({
                    where: { id: ancienSupervisorId },
                    data: { clusterId: null },
                });
            }
            const updateResult = await tx.user.updateMany({
                where: {
                    clusterId: clusterId,
                    role: client_1.Role.COMMERCIAL,
                },
                data: { supervisorId: newSupervisorId },
            });
            this.logger.log(`Cluster "${cluster.name}": superviseur ${newSup.id} assigné, ${updateResult.count} commerciaux mis à jour`);
            return {
                clusterId,
                clusterName: cluster.name,
                newSupervisorId,
                newSupervisorName: newSup.fullName,
                ancienSupervisorId: ancienSupervisorId,
                commerciauxUpdated: updateResult.count,
            };
        });
    }
    async removeSupervisor(clusterId) {
        return this.prisma.$transaction(async (tx) => {
            const cluster = await tx.cluster.findUnique({
                where: { id: clusterId },
                select: { id: true, name: true, supervisorId: true },
            });
            if (!cluster)
                throw new common_1.NotFoundException(`Cluster ${clusterId} introuvable`);
            if (!cluster.supervisorId) {
                throw new common_1.BadRequestException(`Le cluster ${cluster.name} n'a pas de superviseur`);
            }
            const nbCommerciaux = await tx.user.count({
                where: { clusterId, role: client_1.Role.COMMERCIAL, isActive: true },
            });
            if (nbCommerciaux > 0) {
                throw new common_1.ConflictException(`Impossible de retirer le superviseur : ${nbCommerciaux} commerciaux actifs dans ${cluster.name}. Assignez d'abord un nouveau superviseur.`);
            }
            await tx.user.update({
                where: { id: cluster.supervisorId },
                data: { clusterId: null },
            });
            await tx.cluster.update({
                where: { id: clusterId },
                data: { supervisorId: null },
            });
            this.logger.log(`Cluster "${cluster.name}": superviseur retiré`);
            return { clusterId, clusterName: cluster.name, message: 'Superviseur retiré avec succès' };
        });
    }
};
exports.ClustersService = ClustersService;
exports.ClustersService = ClustersService = ClustersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClustersService);
//# sourceMappingURL=clusters.service.js.map