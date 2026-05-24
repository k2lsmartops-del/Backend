import { AgentStatus, Gender, Role } from '@prisma/client';
export declare class CreateUserDto {
    fullName: string;
    email?: string;
    phone: string;
    password: string;
    role: Role;
    status?: AgentStatus;
    zoneId?: string;
    supervisorId?: string;
    phoneSecondary?: string;
    avatarUrl?: string;
    gender?: Gender;
    birthDate?: string;
    cniNumber?: string;
    address?: string;
    educationLevel?: string;
    languages?: string[];
    recruitedAt?: string;
}
