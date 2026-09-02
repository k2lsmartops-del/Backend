import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
type UserWithoutPassword = Omit<User, 'password'>;
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserWithoutPassword;
}
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    login(dto: LoginDto): Promise<AuthResponse>;
    refresh(refreshToken: string): Promise<AuthResponse>;
    logout(refreshToken: string): Promise<void>;
    private generateTokens;
    private calculateExpirationDate;
}
export {};
