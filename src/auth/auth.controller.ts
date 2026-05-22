import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

/**
 * Contrôleur d'authentification.
 * Toutes les routes sont préfixées par /auth.
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/login — Connexion utilisateur.
   * Route publique (pas besoin de token).
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/refresh — Rafraîchit les tokens.
   * Route publique (le refresh token est dans le body).
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * POST /auth/logout — Révoque le refresh token.
   * Route authentifiée.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Déconnexion réussie' };
  }

  /**
   * GET /auth/me — Retourne les infos de l'utilisateur connecté.
   * Route authentifiée.
   */
  @Get('me')
  getMe(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }
}
