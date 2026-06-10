"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    configService;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(dto) {
        console.log('[LOGIN]', {
            identifiant: dto.identifiant,
            pwdBytes: Buffer.from(dto.password, 'utf8').toString('hex'),
            pwdLen: dto.password.length,
        });
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ phone: dto.identifiant }, { email: dto.identifiant }],
            },
            include: {
                cluster: { select: { id: true, name: true } },
                supervisor: { select: { id: true, fullName: true, matricule: true } },
            },
        });
        console.log('[LOGIN]', {
            identifiant: dto.identifiant,
            userFound: !!user,
            userPhone: user?.phone,
            userMatricule: user?.matricule,
            hashStored: user?.password?.substring(0, 30) + '...',
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Identifiants invalides');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Compte désactivé. Contactez votre administrateur.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        console.log('[LOGIN]', {
            identifiant: dto.identifiant,
            bcryptCompare: isPasswordValid,
            pwdProvided: dto.password,
            hashStored: user.password.substring(0, 30) + '...',
        });
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Identifiants invalides');
        }
        const tokens = await this.generateTokens(user);
        const { password, ...userWithoutPassword } = user;
        return {
            ...tokens,
            user: userWithoutPassword,
        };
    }
    async refresh(refreshToken) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: {
                user: {
                    include: {
                        cluster: { select: { id: true, name: true } },
                        supervisor: { select: { id: true, fullName: true, matricule: true } },
                    },
                },
            },
        });
        if (!storedToken || storedToken.revoked) {
            throw new common_1.UnauthorizedException('Refresh token invalide');
        }
        if (new Date() > storedToken.expiresAt) {
            throw new common_1.UnauthorizedException('Refresh token expiré');
        }
        if (!storedToken.user.isActive) {
            throw new common_1.UnauthorizedException('Compte désactivé. Contactez votre administrateur.');
        }
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revoked: true },
        });
        const tokens = await this.generateTokens(storedToken.user);
        const { password, ...userWithoutPassword } = storedToken.user;
        return {
            ...tokens,
            user: userWithoutPassword,
        };
    }
    async logout(refreshToken) {
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (storedToken && !storedToken.revoked) {
            await this.prisma.refreshToken.update({
                where: { id: storedToken.id },
                data: { revoked: true },
            });
        }
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            role: user.role,
            matricule: user.matricule,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.secret'),
            expiresIn: (this.configService.get('jwt.expiresIn') || '15m'),
        });
        const refreshToken = (0, crypto_1.randomBytes)(64).toString('hex');
        const refreshExpiresIn = this.configService.get('jwt.refreshExpiresIn') || '7d';
        const expiresAt = this.calculateExpirationDate(refreshExpiresIn);
        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
    calculateExpirationDate(duration) {
        const now = new Date();
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's':
                return new Date(now.getTime() + value * 1000);
            case 'm':
                return new Date(now.getTime() + value * 60 * 1000);
            case 'h':
                return new Date(now.getTime() + value * 60 * 60 * 1000);
            case 'd':
                return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map