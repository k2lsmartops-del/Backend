"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const USER_SELECT = {
    id: true,
    matricule: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    status: true,
    isActive: true,
    zoneId: true,
    secteurId: true,
    supervisorId: true,
    createdAt: true,
    updatedAt: true,
    zone: {
        select: {
            id: true,
            name: true,
            coordinator: { select: { id: true, fullName: true, matricule: true } },
        },
    },
    secteur: { select: { id: true, name: true } },
    supervisor: { select: { id: true, fullName: true, matricule: true } },
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, currentUser) {
        await this.checkDuplicates(dto.phone, dto.email);
        let effectiveZoneId = dto.zoneId;
        if (currentUser?.role === client_1.Role.COORDINATEUR && currentUser.zoneId) {
            effectiveZoneId = currentUser.zoneId;
        }
        await this.validateRoleAssignments(dto.role, effectiveZoneId, dto.supervisorId);
        const { zoneId, secteurId } = await this.resolveHierarchy(dto.role, dto.supervisorId, dto.secteurId, effectiveZoneId);
        const matricule = await this.generateMatricule(dto.role);
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const status = dto.status || client_1.AgentStatus.ACTIF;
        const isActive = status === client_1.AgentStatus.ACTIF;
        return this.prisma.user.create({
            data: {
                matricule,
                fullName: dto.fullName,
                email: dto.email || null,
                phone: dto.phone,
                password: hashedPassword,
                role: dto.role,
                status,
                isActive,
                zoneId,
                secteurId,
                supervisorId: dto.supervisorId || null,
            },
            select: USER_SELECT,
        });
    }
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, search, role, status, isActive, zoneId, supervisorId, secteurId, } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (currentUser) {
            switch (currentUser.role) {
                case client_1.Role.COORDINATEUR:
                    where.zoneId = currentUser.zoneId;
                    break;
                case client_1.Role.SUPERVISEUR:
                    where.secteurId = currentUser.secteurId;
                    where.role = client_1.Role.COMMERCIAL;
                    break;
            }
        }
        if (role && !where.role)
            where.role = role;
        if (status)
            where.status = status;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (zoneId && !where.zoneId)
            where.zoneId = zoneId;
        if (secteurId && !where.secteurId)
            where.secteurId = secteurId;
        if (supervisorId)
            where.supervisorId = supervisorId;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { matricule: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: USER_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                ...USER_SELECT,
                commercials: {
                    select: { id: true, fullName: true, matricule: true, isActive: true },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }
    async update(id, dto) {
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        if (dto.phone || dto.email) {
            await this.checkDuplicates(dto.phone || existing.phone, dto.email !== undefined ? dto.email : existing.email, id);
        }
        const newRole = dto.role || existing.role;
        const newSupervisorId = dto.supervisorId !== undefined ? dto.supervisorId : existing.supervisorId;
        if (dto.role || dto.supervisorId !== undefined) {
            await this.validateRoleAssignments(newRole, null, newSupervisorId);
        }
        const data = {};
        if (dto.fullName !== undefined)
            data.fullName = dto.fullName;
        if (dto.email !== undefined)
            data.email = dto.email;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        if (dto.role !== undefined)
            data.role = dto.role;
        if (dto.supervisorId !== undefined)
            data.supervisorId = dto.supervisorId;
        if (newRole === client_1.Role.COMMERCIAL && newSupervisorId) {
            const { zoneId, secteurId } = await this.resolveHierarchy(newRole, newSupervisorId, dto.secteurId !== undefined ? dto.secteurId : existing.secteurId, existing.zoneId);
            data.zoneId = zoneId;
            data.secteurId = secteurId;
        }
        else if (newRole === client_1.Role.SUPERVISEUR) {
            const newSecteurId = dto.secteurId !== undefined ? dto.secteurId : existing.secteurId;
            if (newSecteurId) {
                const { zoneId, secteurId } = await this.resolveHierarchy(newRole, null, newSecteurId, existing.zoneId);
                data.zoneId = zoneId;
                data.secteurId = secteurId;
            }
        }
        const isDeactivating = (dto.status !== undefined && dto.status !== client_1.AgentStatus.ACTIF) ||
            (dto.isActive === false);
        if (isDeactivating && existing.role === client_1.Role.SUPERVISEUR) {
            const activeCommerciaux = await this.prisma.user.count({
                where: {
                    supervisorId: id,
                    role: client_1.Role.COMMERCIAL,
                    isActive: true,
                },
            });
            if (activeCommerciaux > 0) {
                throw new common_1.BadRequestException(`Ce superviseur a ${activeCommerciaux} commercial(aux) actif(s). ` +
                    `Réaffectez-les d'abord.`);
            }
        }
        if (isDeactivating && existing.role === client_1.Role.COORDINATEUR) {
            const coordinatedZone = await this.prisma.zone.findFirst({
                where: { coordinatorId: id },
                select: { name: true },
            });
            if (coordinatedZone) {
                throw new common_1.BadRequestException(`Ce coordinateur pilote la zone "${coordinatedZone.name}". ` +
                    `Retirez-le de la zone d'abord.`);
            }
        }
        if (dto.status !== undefined) {
            data.status = dto.status;
            data.isActive = dto.status === client_1.AgentStatus.ACTIF;
        }
        else if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
            data.status = dto.isActive ? client_1.AgentStatus.ACTIF : client_1.AgentStatus.DESACTIVE;
        }
        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 12);
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: USER_SELECT,
        });
    }
    async deactivate(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false, status: client_1.AgentStatus.DESACTIVE },
            select: USER_SELECT,
        });
    }
    async activate(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return this.prisma.user.update({
            where: { id },
            data: { isActive: true, status: client_1.AgentStatus.ACTIF },
            select: USER_SELECT,
        });
    }
    async suspend(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false, status: client_1.AgentStatus.SUSPENDU },
            select: USER_SELECT,
        });
    }
    async resetPassword(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const newPassword = Math.random().toString(36).slice(-8);
        const hashed = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashed },
        });
        return {
            message: 'Mot de passe réinitialisé',
            temporaryPassword: newPassword,
        };
    }
    async getTeam(supervisorId) {
        const members = await this.prisma.user.findMany({
            where: {
                supervisorId,
                role: client_1.Role.COMMERCIAL,
            },
            select: {
                ...USER_SELECT,
                _count: {
                    select: { submissions: true },
                },
                submissions: {
                    select: { status: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { fullName: 'asc' },
        });
        return Promise.all(members.map(async (m) => {
            const validatedCount = await this.prisma.submission.count({
                where: {
                    commercialId: m.id,
                    status: { in: ['SUPERVISOR_APPROVED', 'VALIDATED'] },
                },
            });
            return {
                id: m.id,
                fullName: m.fullName,
                matricule: m.matricule,
                phone: m.phone,
                status: m.status,
                submissionCount: m._count.submissions,
                validatedCount,
                lastActivity: m.submissions[0]?.createdAt || null,
            };
        }));
    }
    async checkDuplicates(phone, email, excludeId) {
        const conditions = [{ phone }];
        if (email)
            conditions.push({ email });
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: conditions,
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
            },
        });
        if (existing) {
            if (existing.phone === phone) {
                throw new common_1.ConflictException('Ce numéro de téléphone est déjà utilisé');
            }
            if (email && existing.email === email) {
                throw new common_1.ConflictException('Cet email est déjà utilisé');
            }
        }
    }
    async validateRoleAssignments(role, zoneId, supervisorId) {
        if (zoneId) {
            const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
            if (!zone) {
                throw new common_1.NotFoundException('Zone non trouvée');
            }
        }
        if (role === client_1.Role.COMMERCIAL) {
            if (!supervisorId) {
                throw new common_1.BadRequestException('Un commercial doit être rattaché à un superviseur');
            }
            const supervisor = await this.prisma.user.findUnique({
                where: { id: supervisorId },
            });
            if (!supervisor) {
                throw new common_1.NotFoundException('Superviseur non trouvé');
            }
            if (supervisor.role !== client_1.Role.SUPERVISEUR) {
                throw new common_1.BadRequestException("L'utilisateur désigné n'est pas un superviseur");
            }
            if (!supervisor.secteurId) {
                throw new common_1.BadRequestException('Le superviseur doit être assigné à un secteur avant de lui rattacher des commerciaux');
            }
        }
    }
    async resolveHierarchy(role, supervisorId, secteurId, zoneId) {
        if (role === client_1.Role.COMMERCIAL && supervisorId) {
            const supervisor = await this.prisma.user.findUnique({
                where: { id: supervisorId },
                select: { zoneId: true, secteurId: true },
            });
            if (supervisor) {
                return {
                    zoneId: supervisor.zoneId,
                    secteurId: supervisor.secteurId,
                };
            }
        }
        if (role === client_1.Role.SUPERVISEUR && secteurId) {
            const secteur = await this.prisma.secteur.findUnique({
                where: { id: secteurId },
                select: { zoneId: true },
            });
            if (secteur) {
                return {
                    zoneId: secteur.zoneId,
                    secteurId,
                };
            }
        }
        return {
            zoneId: zoneId || null,
            secteurId: secteurId || null,
        };
    }
    async generateMatricule(role) {
        const prefixMap = {
            [client_1.Role.ADMIN]: 'ADM',
            [client_1.Role.COORDINATEUR]: 'COORD',
            [client_1.Role.SUPERVISEUR]: 'SUP',
            [client_1.Role.COMMERCIAL]: 'AGT',
            [client_1.Role.CLIENT]: 'CLI',
        };
        const prefix = prefixMap[role];
        const count = await this.prisma.user.count({ where: { role } });
        const number = (count + 1).toString().padStart(3, '0');
        const matricule = `${prefix}-${number}`;
        const exists = await this.prisma.user.findUnique({ where: { matricule } });
        if (exists) {
            let i = count + 2;
            let candidate = `${prefix}-${i.toString().padStart(3, '0')}`;
            while (await this.prisma.user.findUnique({ where: { matricule: candidate } })) {
                i++;
                candidate = `${prefix}-${i.toString().padStart(3, '0')}`;
            }
            return candidate;
        }
        return matricule;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map