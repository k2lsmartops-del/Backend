import type { Cache } from 'cache-manager';
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
    private cache;
    constructor(configService: ConfigService, prisma: PrismaService, cache: Cache);
    validate(payload: JwtPayload): Promise<Record<string, unknown> | {
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        supervisorId: string | null;
        matricule: string;
        email: string | null;
        phone: string;
        sponsorCode: string | null;
        fullName: string;
        gender: string | null;
        role: import("@prisma/client").$Enums.Role;
        status: import("@prisma/client").$Enums.AgentStatus;
        commune: string | null;
        habitation: string | null;
        appInstalled: boolean;
        isOnline: boolean;
        lastActive: Date | null;
        lastLogin: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        clusterId: string | null;
    }>;
}
export {};
