import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto, currentUser?: {
        role: Role;
        zoneId?: string | null;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zone: {
            id: string;
            name: string;
            coordinator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        zoneId: string | null;
        secteurId: string | null;
        supervisorId: string | null;
        secteur: {
            id: string;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    findAll(query: QueryUsersDto, currentUser?: {
        role: Role;
        zoneId?: string | null;
        secteurId?: string | null;
    }): Promise<{
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            zone: {
                id: string;
                name: string;
                coordinator: {
                    id: string;
                    matricule: string;
                    fullName: string;
                } | null;
            } | null;
            matricule: string;
            email: string | null;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.AgentStatus;
            zoneId: string | null;
            secteurId: string | null;
            supervisorId: string | null;
            secteur: {
                id: string;
                name: string;
            } | null;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zone: {
            id: string;
            name: string;
            coordinator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        zoneId: string | null;
        secteurId: string | null;
        supervisorId: string | null;
        secteur: {
            id: string;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        commercials: {
            id: string;
            isActive: boolean;
            matricule: string;
            fullName: string;
        }[];
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zone: {
            id: string;
            name: string;
            coordinator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        zoneId: string | null;
        secteurId: string | null;
        supervisorId: string | null;
        secteur: {
            id: string;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zone: {
            id: string;
            name: string;
            coordinator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        zoneId: string | null;
        secteurId: string | null;
        supervisorId: string | null;
        secteur: {
            id: string;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    activate(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zone: {
            id: string;
            name: string;
            coordinator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        zoneId: string | null;
        secteurId: string | null;
        supervisorId: string | null;
        secteur: {
            id: string;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    suspend(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zone: {
            id: string;
            name: string;
            coordinator: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        zoneId: string | null;
        secteurId: string | null;
        supervisorId: string | null;
        secteur: {
            id: string;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    resetPassword(id: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    getTeam(supervisorId: string): Promise<{
        id: string;
        fullName: string;
        matricule: string;
        phone: string;
        status: import("@prisma/client").$Enums.AgentStatus;
        submissionCount: number;
        validatedCount: number;
        lastActivity: Date;
    }[]>;
    private checkDuplicates;
    private validateRoleAssignments;
    private resolveHierarchy;
    private generateMatricule;
}
