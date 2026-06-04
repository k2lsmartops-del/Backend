import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { User } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CommunesService } from './communes.service';

@Controller('communes')
export class CommunesController {
  constructor(private communesService: CommunesService) {}

  /**
   * GET /communes/my-zone — Communes et quartiers de la zone du commercial
   * Retourne les communes affectées à la zone de l'utilisateur connecté,
   * avec leurs quartiers. Permet au commercial de sélectionner facilement.
   * IMPORTANT: Cette route doit être AVANT les routes génériques pour éviter les conflits
   */
  @Get('my-zone')
  @Roles(Role.COMMERCIAL, Role.SUPERVISEUR, Role.COORDINATEUR, Role.ADMIN)
  findMyZone(@CurrentUser() user: User) {
    return this.communesService.findByUserZone(user);
  }

  /**
   * GET /communes — Liste toutes les communes (admin/coordinateur)
   */
  @Get()
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  findAll() {
    return this.communesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.communesService.findOne(id);
  }
}
