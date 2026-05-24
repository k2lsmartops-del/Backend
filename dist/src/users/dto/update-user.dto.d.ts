import { AgentStatus, Gender, Role } from '@prisma/client';
export declare class UpdateUserDto {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: Role;
    status?: AgentStatus;
    isActive?: boolean;
    zoneId?: string | null;
    supervisorId?: string | null;
    phoneSecondary?: string | null;
    avatarUrl?: string | null;
    gender?: Gender | null;
    birthDate?: string | null;
    cniNumber?: string | null;
    address?: string | null;
    educationLevel?: string | null;
    languages?: string[];
    recruitedAt?: string | null;
}
