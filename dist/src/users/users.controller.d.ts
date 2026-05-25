import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
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
    create(dto: CreateUserDto): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        birthDate: Date | null;
        cniNumber: string | null;
        address: string | null;
        educationLevel: string | null;
        languages: string[];
        recruitedAt: Date | null;
        zoneId: string | null;
        supervisorId: string | null;
        zone: {
            name: string;
            id: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    findAll(query: QueryUsersDto): Promise<{
        data: {
            id: string;
            matricule: string;
            fullName: string;
            email: string | null;
            phone: string;
            phoneSecondary: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.AgentStatus;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            avatarUrl: string | null;
            gender: import("@prisma/client").$Enums.Gender | null;
            birthDate: Date | null;
            cniNumber: string | null;
            address: string | null;
            educationLevel: string | null;
            languages: string[];
            recruitedAt: Date | null;
            zoneId: string | null;
            supervisorId: string | null;
            zone: {
                name: string;
                id: string;
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
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        birthDate: Date | null;
        cniNumber: string | null;
        address: string | null;
        educationLevel: string | null;
        languages: string[];
        recruitedAt: Date | null;
        zoneId: string | null;
        supervisorId: string | null;
        zone: {
            name: string;
            id: string;
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
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        birthDate: Date | null;
        cniNumber: string | null;
        address: string | null;
        educationLevel: string | null;
        languages: string[];
        recruitedAt: Date | null;
        zoneId: string | null;
        supervisorId: string | null;
        zone: {
            name: string;
            id: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        birthDate: Date | null;
        cniNumber: string | null;
        address: string | null;
        educationLevel: string | null;
        languages: string[];
        recruitedAt: Date | null;
        zoneId: string | null;
        supervisorId: string | null;
        zone: {
            name: string;
            id: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    activate(id: string): Promise<{
        id: string;
        matricule: string;
        fullName: string;
        email: string | null;
        phone: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        birthDate: Date | null;
        cniNumber: string | null;
        address: string | null;
        educationLevel: string | null;
        languages: string[];
        recruitedAt: Date | null;
        zoneId: string | null;
        supervisorId: string | null;
        zone: {
            name: string;
            id: string;
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
        fullName: string;
        email: string | null;
        phone: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        avatarUrl: string | null;
        gender: import("@prisma/client").$Enums.Gender | null;
        birthDate: Date | null;
        cniNumber: string | null;
        address: string | null;
        educationLevel: string | null;
        languages: string[];
        recruitedAt: Date | null;
        zoneId: string | null;
        supervisorId: string | null;
        zone: {
            name: string;
            id: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
}
