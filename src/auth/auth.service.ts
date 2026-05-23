import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

/**
 * Type de l'utilisateur sans le mot de passe (pour les réponses API).
 */
type UserWithoutPassword = Omit<User, 'password'>;

/**
 * Réponse retournée après login ou refresh.
 */
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserWithoutPassword;
}

/**
 * Service d'authentification.
 * Gère le login, la génération des tokens, le refresh et le logout.
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Authentifie un utilisateur avec son identifiant (phone ou email) et mot de passe.
   * Retourne les tokens et les infos utilisateur.
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    // Recherche l'utilisateur par phone OU email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: dto.identifiant }, { email: dto.identifiant }],
      },
    });

    // Message générique pour ne pas révéler si c'est l'identifiant ou le mdp qui est faux
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Vérifie si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Compte désactivé. Contactez votre administrateur.',
      );
    }

    // Vérifie le mot de passe
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Génère les tokens
    const tokens = await this.generateTokens(user);

    // Retourne les tokens et l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  /**
   * Rafraîchit les tokens à partir d'un refresh token valide.
   * L'ancien refresh token est révoqué (rotation).
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    // Recherche le refresh token en base
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    // Vérifie que le token existe et n'est pas révoqué
    if (!storedToken || storedToken.revoked) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Vérifie que le token n'est pas expiré
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    // Vérifie que l'utilisateur est toujours actif
    if (!storedToken.user.isActive) {
      throw new UnauthorizedException(
        'Compte désactivé. Contactez votre administrateur.',
      );
    }

    // Révoque l'ancien refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Génère de nouveaux tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Retourne les nouveaux tokens et l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = storedToken.user;
    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  /**
   * Révoque un refresh token (logout).
   */
  async logout(refreshToken: string): Promise<void> {
    // Recherche et révoque le token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (storedToken && !storedToken.revoked) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
    }
    // Pas d'erreur si le token n'existe pas (idempotence)
  }

  /**
   * Génère un access token et un refresh token pour un utilisateur.
   */
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Payload de l'access token
    const payload = {
      sub: user.id,
      role: user.role,
      matricule: user.matricule,
    };

    // Génère l'access token (courte durée)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
    });

    // Génère un refresh token aléatoire (stocké en base)
    const refreshToken = randomBytes(64).toString('hex');

    // Calcule la date d'expiration du refresh token
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresAt = this.calculateExpirationDate(refreshExpiresIn);

    // Stocke le refresh token en base
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Calcule la date d'expiration à partir d'une durée (ex: "7d", "15m").
   */
  private calculateExpirationDate(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      // Par défaut 7 jours si format invalide
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
}
