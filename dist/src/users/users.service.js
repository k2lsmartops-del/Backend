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
    clusterId: true,
    supervisorId: true,
    createdAt: true,
    updatedAt: true,
    appInstalled: true,
    isOnline: true,
    lastActive: true,
    lastLogin: true,
    cluster: {
        select: {
            id: true,
            name: true,
            supervisor: { select: { id: true, fullName: true, matricule: true } },
        },
    },
    supervisor: { select: { id: true, fullName: true, matricule: true } },
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, currentUser) {
        if (currentUser?.role === client_1.Role.SUPERVISEUR) {
            if (dto.role !== client_1.Role.COMMERCIAL) {
                throw new common_1.ForbiddenException('Un superviseur ne peut créer que des commerciaux');
            }
            dto.supervisorId = currentUser.id;
        }
        await this.checkDuplicates(dto.phone, dto.email);
        let effectiveClusterId = dto.clusterId;
        await this.validateRoleAssignments(dto.role, effectiveClusterId, dto.supervisorId);
        const clusterId = await this.resolveHierarchy(dto.role, dto.supervisorId, effectiveClusterId);
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
                clusterId,
                supervisorId: dto.supervisorId || null,
            },
            select: USER_SELECT,
        });
    }
    async findAll(query, currentUser) {
        const { page = 1, limit = 20, search, role, status, isActive, clusterId, supervisorId, } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (currentUser) {
            switch (currentUser.role) {
                case client_1.Role.COORDINATEUR:
                    break;
                case client_1.Role.SUPERVISEUR:
                    where.supervisorId = currentUser.clusterId ? undefined : undefined;
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
        if (clusterId && !where.clusterId)
            where.clusterId = clusterId;
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
    async findOne(id, currentUser) {
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
        if (currentUser?.role === client_1.Role.SUPERVISEUR) {
            if (user.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Accès non autorisé à cet utilisateur');
            }
        }
        return user;
    }
    async update(id, dto, currentUser) {
        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        if (currentUser?.role === client_1.Role.SUPERVISEUR) {
            if (existing.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Accès non autorisé à cet utilisateur');
            }
            if (dto.role && dto.role !== client_1.Role.COMMERCIAL) {
                throw new common_1.ForbiddenException('Un superviseur ne peut pas changer le rôle');
            }
            if (dto.supervisorId !== undefined && dto.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Un superviseur ne peut pas réaffecter un commercial');
            }
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
            const clusterId = await this.resolveHierarchy(newRole, newSupervisorId, existing.clusterId);
            data.clusterId = clusterId;
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
        if (isDeactivating && existing.role === client_1.Role.SUPERVISEUR) {
            const managedCluster = await this.prisma.cluster.findFirst({
                where: { supervisorId: id },
                select: { name: true },
            });
            if (managedCluster) {
                throw new common_1.BadRequestException(`Ce superviseur pilote le cluster "${managedCluster.name}". ` +
                    `Retirez-le du cluster d'abord.`);
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
    async deactivate(id, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        if (currentUser?.role === client_1.Role.SUPERVISEUR) {
            if (user.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Accès non autorisé à cet utilisateur');
            }
        }
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false, status: client_1.AgentStatus.DESACTIVE },
            select: USER_SELECT,
        });
    }
    async activate(id, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        if (currentUser?.role === client_1.Role.SUPERVISEUR) {
            if (user.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Accès non autorisé à cet utilisateur');
            }
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
    async resetPassword(id, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        if (currentUser?.role === client_1.Role.SUPERVISEUR) {
            if (user.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Accès non autorisé à cet utilisateur');
            }
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
    async removeFromTeam(id, currentUser) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        if (user.role !== client_1.Role.COMMERCIAL) {
            throw new common_1.BadRequestException('Seuls les commerciaux peuvent être retirés d\'une équipe');
        }
        if (currentUser?.role === client_1.Role.SUPERVISEUR) {
            if (user.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Accès non autorisé à cet utilisateur');
            }
        }
        return this.prisma.user.update({
            where: { id },
            data: { supervisorId: null, clusterId: null },
            select: USER_SELECT,
        });
    }
    async bulkImport(rows) {
        console.log(`[Import] Début de l'import de ${rows.length} ligne(s)`);
        const norm = (v) => (v ?? '').toString().trim();
        const rolePriority = {
            COORDINATEUR: 1,
            SUPERVISEUR: 2,
            COMMERCIAL: 3,
        };
        const results = [];
        const indexed = rows.map((r, idx) => ({ r, rowNum: idx + 2 }));
        indexed.sort((a, b) => (rolePriority[norm(a.r.role).toUpperCase()] || 99) -
            (rolePriority[norm(b.r.role).toUpperCase()] || 99));
        for (const { r, rowNum } of indexed) {
            const role = norm(r.role).toUpperCase();
            const fullName = norm(r.fullName);
            const phone = norm(r.phone);
            const email = norm(r.email) || null;
            try {
                if (!fullName)
                    throw new common_1.BadRequestException('Nom complet requis');
                if (!phone)
                    throw new common_1.BadRequestException('Téléphone requis');
                const rawPassword = norm(r.password) || this.generateDefaultPassword();
                const existingUser = await this.prisma.user.findUnique({
                    where: { phone },
                });
                console.log('[IMPORT]', {
                    ligne: rowNum,
                    phone: phone,
                    pwdProvided: !!norm(r.password),
                    pwdLen: rawPassword.length,
                });
                if (rawPassword.length < 8) {
                    throw new common_1.BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
                }
                if (email) {
                    const existingEmail = await this.prisma.user.findUnique({
                        where: { email },
                    });
                    if (existingEmail) {
                        throw new common_1.ConflictException(`Email ${email} déjà utilisé par ${existingEmail.matricule}`);
                    }
                }
                const hashedPassword = await bcrypt.hash(rawPassword, 12);
                if (role === 'COORDINATEUR') {
                    const zoneName = norm(r.zone);
                    if (!zoneName) {
                        throw new common_1.BadRequestException('Cluster (zone) requis pour un coordinateur');
                    }
                    let user;
                    let matricule;
                    let status;
                    if (existingUser) {
                        matricule = existingUser.matricule;
                        user = await this.prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                fullName,
                                email,
                                password: hashedPassword,
                                role: client_1.Role.COORDINATEUR,
                                status: client_1.AgentStatus.ACTIF,
                                isActive: true,
                            },
                        });
                        status = 'updated';
                    }
                    else {
                        matricule = await this.generateMatricule(client_1.Role.COORDINATEUR);
                        user = await this.prisma.user.create({
                            data: {
                                matricule,
                                fullName,
                                email,
                                phone,
                                password: hashedPassword,
                                role: client_1.Role.COORDINATEUR,
                                status: client_1.AgentStatus.ACTIF,
                                isActive: true,
                            },
                        });
                        status = 'created';
                    }
                    results.push({
                        row: rowNum,
                        status,
                        role,
                        fullName,
                        matricule,
                    });
                    console.log(`[Import] Ligne ${rowNum}: COORDINATEUR ${fullName} ${status === 'created' ? 'créé' : 'mis à jour'} (${matricule}) - Cluster: ${zoneName}`);
                }
                else if (role === 'SUPERVISEUR') {
                    const zoneName = norm(r.zone);
                    if (!zoneName) {
                        throw new common_1.BadRequestException('Cluster (zone) requis pour un superviseur');
                    }
                    let cluster = await this.prisma.cluster.findUnique({
                        where: { name: zoneName },
                    });
                    if (!cluster) {
                        cluster = await this.prisma.cluster.create({
                            data: { name: zoneName },
                        });
                    }
                    let matricule;
                    let status;
                    if (existingUser) {
                        matricule = existingUser.matricule;
                        await this.prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                fullName,
                                email,
                                password: hashedPassword,
                                role: client_1.Role.SUPERVISEUR,
                                status: client_1.AgentStatus.ACTIF,
                                isActive: true,
                                clusterId: cluster.id,
                            },
                        });
                        status = 'updated';
                    }
                    else {
                        matricule = await this.generateMatricule(client_1.Role.SUPERVISEUR);
                        await this.prisma.user.create({
                            data: {
                                matricule,
                                fullName,
                                email,
                                phone,
                                password: hashedPassword,
                                role: client_1.Role.SUPERVISEUR,
                                status: client_1.AgentStatus.ACTIF,
                                isActive: true,
                                clusterId: cluster.id,
                            },
                        });
                        status = 'created';
                    }
                    results.push({
                        row: rowNum,
                        status,
                        role,
                        fullName,
                        matricule,
                    });
                    console.log(`[Import] Ligne ${rowNum}: SUPERVISEUR ${fullName} ${status === 'created' ? 'créé' : 'mis à jour'} (${matricule}) - Cluster: ${zoneName}`);
                }
                else if (role === 'COMMERCIAL') {
                    const supPhone = norm(r.supervisorPhone);
                    if (!supPhone) {
                        throw new common_1.BadRequestException('Téléphone du superviseur requis pour un commercial');
                    }
                    const supervisor = await this.prisma.user.findUnique({
                        where: { phone: supPhone },
                    });
                    if (!supervisor || supervisor.role !== client_1.Role.SUPERVISEUR) {
                        throw new common_1.NotFoundException(`Superviseur (${supPhone}) introuvable`);
                    }
                    let matricule;
                    let status;
                    if (existingUser) {
                        matricule = existingUser.matricule;
                        await this.prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                fullName,
                                email,
                                password: hashedPassword,
                                role: client_1.Role.COMMERCIAL,
                                status: client_1.AgentStatus.ACTIF,
                                isActive: true,
                                supervisorId: supervisor.id,
                                clusterId: supervisor.clusterId,
                            },
                        });
                        status = 'updated';
                    }
                    else {
                        matricule = await this.generateMatricule(client_1.Role.COMMERCIAL);
                        await this.prisma.user.create({
                            data: {
                                matricule,
                                fullName,
                                email,
                                phone,
                                password: hashedPassword,
                                role: client_1.Role.COMMERCIAL,
                                status: client_1.AgentStatus.ACTIF,
                                isActive: true,
                                supervisorId: supervisor.id,
                                clusterId: supervisor.clusterId,
                            },
                        });
                        status = 'created';
                    }
                    results.push({
                        row: rowNum,
                        status,
                        role,
                        fullName,
                        matricule,
                    });
                    console.log(`[Import] Ligne ${rowNum}: COMMERCIAL ${fullName} ${status === 'created' ? 'créé' : 'mis à jour'} (${matricule}) - Superviseur: ${supPhone}`);
                }
                else {
                    throw new common_1.BadRequestException(`Rôle invalide: "${r.role}" (attendu: COORDINATEUR, SUPERVISEUR ou COMMERCIAL)`);
                }
            }
            catch (e) {
                results.push({
                    row: rowNum,
                    status: 'error',
                    role,
                    fullName,
                    message: e instanceof Error ? e.message : 'Erreur inconnue',
                });
            }
        }
        results.sort((a, b) => a.row - b.row);
        const created = results.filter((r) => r.status === 'created').length;
        const updated = results.filter((r) => r.status === 'updated').length;
        const failed = results.filter((r) => r.status === 'error').length;
        console.log(`[Import] Terminé: ${created} créé(s), ${updated} mis à jour, ${failed} échec(s) sur ${results.length} ligne(s)`);
        return {
            total: results.length,
            created,
            updated,
            failed,
            results,
        };
    }
    generateDefaultPassword() {
        return `K2l${Math.random().toString(36).slice(2, 8)}!`;
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
                    status: 'VALIDATED',
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
    async validateRoleAssignments(role, clusterId, supervisorId) {
        if (clusterId) {
            const cluster = await this.prisma.cluster.findUnique({ where: { id: clusterId } });
            if (!cluster) {
                throw new common_1.NotFoundException('Cluster non trouvé');
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
        }
    }
    async resolveHierarchy(role, supervisorId, clusterId) {
        if (role === client_1.Role.COMMERCIAL && supervisorId) {
            const supervisor = await this.prisma.user.findUnique({
                where: { id: supervisorId },
                select: { clusterId: true },
            });
            if (supervisor) {
                return supervisor.clusterId;
            }
        }
        return clusterId || null;
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
    async getStats(userId, currentUser) {
        if (currentUser.role === client_1.Role.SUPERVISEUR) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { supervisorId: true },
            });
            if (!user || user.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Vous ne pouvez voir que les statistiques de vos commerciaux');
            }
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                cluster: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const [totalSubmissions, validatedSubmissions, rejectedSubmissions, todaySubmissions, weekSubmissions] = await Promise.all([
            this.prisma.submission.count({
                where: { commercialId: userId },
            }),
            this.prisma.submission.count({
                where: { commercialId: userId, status: 'VALIDATED' },
            }),
            this.prisma.submission.count({
                where: { commercialId: userId, status: 'REJECTED' },
            }),
            this.prisma.submission.count({
                where: { commercialId: userId, createdAt: { gte: startOfToday } },
            }),
            this.prisma.submission.count({
                where: { commercialId: userId, createdAt: { gte: startOfWeek } },
            }),
        ]);
        const validationRate = totalSubmissions > 0
            ? Math.round((validatedSubmissions / totalSubmissions) * 100)
            : 0;
        return {
            totalSubmissions,
            validatedSubmissions,
            rejectedSubmissions,
            todaySubmissions,
            weekSubmissions,
            validationRate,
        };
    }
    async getPayment(userId, currentUser) {
        if (currentUser.role === client_1.Role.SUPERVISEUR) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { supervisorId: true },
            });
            if (!user || user.supervisorId !== currentUser.id) {
                throw new common_1.ForbiddenException('Vous ne pouvez voir que les paiements de vos commerciaux');
            }
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const validatedSubmissions = await this.prisma.submission.count({
            where: { commercialId: userId, status: 'VALIDATED' },
        });
        const ratePerSubmission = 500;
        const totalEarned = validatedSubmissions * ratePerSubmission;
        const paidAmount = 0;
        const pendingPayment = totalEarned - paidAmount;
        return {
            totalEarned,
            paidAmount,
            pendingPayment,
            ratePerSubmission,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map