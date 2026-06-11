import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
interface JwtPayload {
    sub: string;
    role: string;
    matricule: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        cluster: {
            id: string;
            name: string;
        } | null;
        supervisor: {
            id: string;
            matricule: string;
            fullName: string;
        } | null;
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
    }>;
}
export {};
