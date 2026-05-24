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
        matricule: string;
        email: string | null;
        phone: string;
        fullName: string;
        phoneSecondary: string | null;
        password: string;
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
    }, "password">;
}
