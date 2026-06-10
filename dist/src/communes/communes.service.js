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
exports.CommunesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CommunesService = class CommunesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.commune.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { quartiers: true } },
                cluster: { select: { id: true, name: true } },
            },
        });
    }
    async findOne(id) {
        return this.prisma.commune.findUnique({
            where: { id },
            include: {
                quartiers: {
                    orderBy: { name: 'asc' },
                },
                cluster: { select: { id: true, name: true } },
            },
        });
    }
    async findByUserCluster(user) {
        if (!user.clusterId) {
            return { communes: [], message: 'Aucun cluster assigné' };
        }
        const communes = await this.prisma.commune.findMany({
            where: { clusterId: user.clusterId },
            orderBy: { name: 'asc' },
            include: {
                quartiers: {
                    orderBy: { name: 'asc' },
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const cluster = await this.prisma.cluster.findUnique({
            where: { id: user.clusterId },
            select: { id: true, name: true },
        });
        return {
            cluster,
            communes: communes.map((c) => ({
                id: c.id,
                name: c.name,
                quartiers: c.quartiers,
            })),
        };
    }
};
exports.CommunesService = CommunesService;
exports.CommunesService = CommunesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommunesService);
//# sourceMappingURL=communes.service.js.map