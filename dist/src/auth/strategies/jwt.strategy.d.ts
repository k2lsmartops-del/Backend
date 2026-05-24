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
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
    }>;
}
export {};
