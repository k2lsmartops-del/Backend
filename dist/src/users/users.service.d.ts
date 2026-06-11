import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { BulkImportRowDto } from './dto/bulk-import.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto, currentUser?: {
        id?: string;
        role: Role;
        clusterId?: string | null;
    }): Promise<{
        id: string;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        clusterId: string | null;
        supervisorId: string | null;
        cluster: {
            id: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
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
        clusterId?: string | null;
    }): Promise<{
        data: {
            id: string;
            matricule: string;
            email: string | null;
            phone: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.AgentStatus;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            appInstalled: boolean;
            isOnline: boolean;
            lastActive: Date | null;
            lastLogin: Date | null;
            clusterId: string | null;
            supervisorId: string | null;
            cluster: {
                id: string;
                supervisor: {
                    id: string;
                    matricule: string;
                    fullName: string;
                } | null;
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
    findOne(id: string, currentUser?: {
        id?: string;
        role: Role;
    }): Promise<{
        id: string;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        clusterId: string | null;
        supervisorId: string | null;
        cluster: {
            id: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
        commercials: {
            id: string;
            matricule: string;
            fullName: string;
            isActive: boolean;
        }[];
    }>;
    update(id: string, dto: UpdateUserDto, currentUser?: {
        id?: string;
        role: Role;
    }): Promise<{
        id: string;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        clusterId: string | null;
        supervisorId: string | null;
        cluster: {
            id: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    deactivate(id: string, currentUser?: {
        id?: string;
        role: Role;
    }): Promise<{
        id: string;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        clusterId: string | null;
        supervisorId: string | null;
        cluster: {
            id: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    activate(id: string, currentUser?: {
        id?: string;
        role: Role;
    }): Promise<{
        id: string;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        clusterId: string | null;
        supervisorId: string | null;
        cluster: {
            id: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
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
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        clusterId: string | null;
        supervisorId: string | null;
        cluster: {
            id: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    resetPassword(id: string, currentUser?: {
        id?: string;
        role: Role;
    }): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    removeFromTeam(id: string, currentUser?: {
        id?: string;
        role: Role;
    }): Promise<{
        id: string;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        clusterId: string | null;
        supervisorId: string | null;
        cluster: {
            id: string;
            supervisor: {
                id: string;
                matricule: string;
                fullName: string;
            } | null;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    bulkImport(rows: BulkImportRowDto[]): Promise<{
        total: number;
        created: number;
        updated: number;
        failed: number;
        results: {
            row: number;
            status: "created" | "updated" | "error";
            role?: string;
            fullName?: string;
            matricule?: string;
            message?: string;
        }[];
    }>;
    private generateDefaultPassword;
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
    getStats(userId: string, currentUser: any): Promise<{
        totalSubmissions: number;
        validatedSubmissions: number;
        rejectedSubmissions: number;
        todaySubmissions: number;
        weekSubmissions: number;
        validationRate: number;
    }>;
    getPayment(userId: string, currentUser: any): Promise<{
        totalValidated: number;
        installedCount: number;
        installedActivatedCount: number;
        note: string;
    }>;
    changePassword(userId: string, newPassword: string): Promise<{
        message: string;
    }>;
}
