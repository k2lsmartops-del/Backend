import { AgentStatus, Role } from '@prisma/client';
export declare class CreateUserDto {
    fullName: string;
    email?: string;
    phone: string;
    password: string;
    role: Role;
    status?: AgentStatus;
    clusterId?: string;
    supervisorId?: string;
    sponsorCode?: string;
}
