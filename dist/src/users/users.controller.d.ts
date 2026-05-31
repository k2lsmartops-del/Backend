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
        failed: number;
        results: {
            row: number;
            status: "created" | "error";
            role?: string;
            fullName?: string;
            matricule?: string;
            message?: string;
        }[];
    }>;
    create(currentUser: Omit<User, 'password'>, dto: CreateUserDto): Promise<{
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
    findAll(user: Omit<User, 'password'>, query: QueryUsersDto): Promise<{
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
    findOne(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    update(currentUser: Omit<User, 'password'>, id: string, dto: UpdateUserDto): Promise<{
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
    deactivate(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    activate(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    resetPassword(currentUser: Omit<User, 'password'>, id: string): Promise<{
        message: string;
        temporaryPassword: string;
    }>;
    removeFromTeam(currentUser: Omit<User, 'password'>, id: string): Promise<{
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
    testPassword(dto: {
        phone: string;
        password: string;
    }): Promise<{
        success: boolean;
        error: string;
        phone: string;
        user?: undefined;
        passwordTest?: undefined;
        hashInfo?: undefined;
    } | {
        success: boolean;
        user: {
            matricule: string;
            fullName: string;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.AgentStatus;
            isActive: boolean;
        };
        passwordTest: {
            original: boolean;
            originalLength: number;
            originalBytes: number[];
            variations: Record<string, boolean>;
        };
        hashInfo: {
            stored: string;
        };
        error?: undefined;
        phone?: undefined;
    }>;
}
