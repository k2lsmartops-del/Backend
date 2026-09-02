"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    prisma;
    cache;
    constructor(configService, prisma, cache) {
        const secret = configService.get('jwt.secret');
        if (!secret) {
            throw new Error("JWT_SECRET non défini dans les variables d'environnement");
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
        this.configService = configService;
        this.prisma = prisma;
        this.cache = cache;
    }
    async validate(payload) {
        const cacheKey = `auth:user:${payload.sub}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: {
                cluster: { select: { id: true, name: true } },
                supervisor: { select: { id: true, fullName: true, matricule: true } },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur non trouvé');
        }
        if (!user.isActive || user.status !== 'ACTIF') {
            const messages = {
                SUSPENDU: 'Compte suspendu. Contactez votre superviseur.',
                EN_ATTENTE: 'Compte en attente de validation.',
                DESACTIVE: 'Compte désactivé.',
            };
            throw new common_1.UnauthorizedException(messages[user.status] || 'Compte désactivé');
        }
        const { password, ...userWithoutPassword } = user;
        await this.cache.set(cacheKey, userWithoutPassword);
        return userWithoutPassword;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, Object])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map