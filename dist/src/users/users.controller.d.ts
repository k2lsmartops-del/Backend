import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { BulkImportDto } from './dto/bulk-import.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getTeam(user: Omit<User, 'password'>): Promise<{
        id: string;
        fullName: string;
        matricule: string;
        phone: string;
        status: import("@prisma/client").$Enums.AgentStatus;
        submissionCount: number;
        validatedCount: number;
        lastActivity: Date;
    }[]>;
    bulkImport(dto: BulkImportDto): Promise<{
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
    create(currentUser: Omit<User, 'password'>, dto: CreateUserDto): Promise<{
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
    findAll(user: Omit<User, 'password'>, query: QueryUsersDto): Promise<{
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
    findOne(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    update(currentUser: Omit<User, 'password'>, id: string, dto: UpdateUserDto): Promise<{
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
    deactivate(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    activate(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    resetPassword(currentUser: Omit<User, 'password'>, id: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    removeFromTeam(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    getStats(currentUser: Omit<User, 'password'>, id: string): Promise<{
        totalSubmissions: number;
        validatedSubmissions: number;
        rejectedSubmissions: number;
        todaySubmissions: number;
        weekSubmissions: number;
        validationRate: number;
    }>;
    getPayment(currentUser: Omit<User, 'password'>, id: string): Promise<{
        totalValidated: number;
        installedCount: number;
        installedActivatedCount: number;
        note: string;
    }>;
}
