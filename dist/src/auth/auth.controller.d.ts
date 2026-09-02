import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<import("./auth.service").AuthResponse>;
    refresh(dto: RefreshDto): Promise<import("./auth.service").AuthResponse>;
    logout(dto: RefreshDto): Promise<{
        message: string;
    }>;
    getMe(user: Omit<User, 'password'>): Omit<{
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
        password: string;
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
    }, "password">;
}
