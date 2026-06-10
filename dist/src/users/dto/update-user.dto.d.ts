import { AgentStatus, Role } from '@prisma/client';
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
}
