import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateUserDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        zone: {
            id: string;
            name: string;
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
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
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
    }>;
    findAll(query: QueryUsersDto): Promise<{
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            zone: {
                id: string;
                name: string;
            } | null;
            matricule: string;
            email: string | null;
            phone: string;
            fullName: string;
            phoneSecondary: string | null;
            role: import("@prisma/client").$Enums.Role;
            status: import("@prisma/client").$Enums.AgentStatus;
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
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
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
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
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
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
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
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
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
        } | null;
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        phoneSecondary: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
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
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
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
    private generateMatricule;
}
