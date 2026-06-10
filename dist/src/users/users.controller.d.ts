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
        fullName: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        clusterId: string | null;
        supervisorId: string | null;
        appInstalled: never;
        isOnline: never;
        lastActive: never;
        lastLogin: never;
    }>;
    findAll(user: Omit<User, 'password'>, query: QueryUsersDto): Promise<{
        data: {
            id: string;
            matricule: string;
            fullName: string;
            email: string | null;
            phone: string;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.AgentStatus;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
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
            clusterId: string | null;
            supervisorId: string | null;
            appInstalled: never;
            isOnline: never;
            lastActive: never;
            lastLogin: never;
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
        fullName: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        clusterId: string | null;
        supervisorId: string | null;
        appInstalled: never;
        isOnline: never;
        lastActive: never;
        lastLogin: never;
    }>;
    update(currentUser: Omit<User, 'password'>, id: string, dto: UpdateUserDto): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        clusterId: string | null;
        supervisorId: string | null;
        appInstalled: never;
        isOnline: never;
        lastActive: never;
        lastLogin: never;
    }>;
    deactivate(currentUser: Omit<User, 'password'>, id: string): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        clusterId: string | null;
        supervisorId: string | null;
        appInstalled: never;
        isOnline: never;
        lastActive: never;
        lastLogin: never;
    }>;
    activate(currentUser: Omit<User, 'password'>, id: string): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        clusterId: string | null;
        supervisorId: string | null;
        appInstalled: never;
        isOnline: never;
        lastActive: never;
        lastLogin: never;
    }>;
    suspend(id: string): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        clusterId: string | null;
        supervisorId: string | null;
        appInstalled: never;
        isOnline: never;
        lastActive: never;
        lastLogin: never;
    }>;
    resetPassword(currentUser: Omit<User, 'password'>, id: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    removeFromTeam(currentUser: Omit<User, 'password'>, id: string): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        clusterId: string | null;
        supervisorId: string | null;
        appInstalled: never;
        isOnline: never;
        lastActive: never;
        lastLogin: never;
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
        totalEarned: number;
        paidAmount: number;
        pendingPayment: number;
        ratePerSubmission: number;
    }>;
}
