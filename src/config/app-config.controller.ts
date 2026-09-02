import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AppConfigService, CONFIG_KEYS } from './app-config.service';

class UpdateConfigDto {
  objectifQuotidienParCommercial?: number;
  effectifPrevu?: number;
}

@Controller('config')
export class AppConfigController {
  constructor(private appConfigService: AppConfigService) {}

  /**
   * GET /config — Récupère toutes les configurations.
   * Accessible uniquement aux ADMIN.
   */
  @Get()
  @Roles(Role.ADMIN)
  async getAll() {
    const configs = await this.appConfigService.getAll();
    const objectifGlobal = await this.appConfigService.getObjectifGlobalQuotidien();
    
    return {
      configs,
      computed: {
        objectifGlobalQuotidien: objectifGlobal.objectifGlobal,
        commerciauxActifs: objectifGlobal.commerciauxActifs,
        objectifParCommercial: objectifGlobal.objectifParCommercial,
        effectifPrevu: objectifGlobal.effectifPrevu,
        formule: `${objectifGlobal.commerciauxActifs} commerciaux × ${objectifGlobal.objectifParCommercial} = ${objectifGlobal.objectifGlobal} soumissions/jour`,
      },
    };
  }

  /**
   * PATCH /config — Met à jour les configurations.
   * Accessible uniquement aux ADMIN.
   */
  @Patch()
  @Roles(Role.ADMIN)
  async update(@Body() dto: UpdateConfigDto) {
    if (dto.objectifQuotidienParCommercial !== undefined) {
      await this.appConfigService.set(
        CONFIG_KEYS.OBJECTIF_QUOTIDIEN_PAR_COMMERCIAL,
        String(dto.objectifQuotidienParCommercial),
      );
    }
    
    if (dto.effectifPrevu !== undefined) {
      await this.appConfigService.set(
        CONFIG_KEYS.EFFECTIF_PREVU,
        String(dto.effectifPrevu),
      );
    }

    // Retourner les nouvelles valeurs calculées
    const objectifGlobal = await this.appConfigService.getObjectifGlobalQuotidien();
    
    return {
      message: 'Configuration mise à jour',
      computed: {
        objectifGlobalQuotidien: objectifGlobal.objectifGlobal,
        commerciauxActifs: objectifGlobal.commerciauxActifs,
        objectifParCommercial: objectifGlobal.objectifParCommercial,
        effectifPrevu: objectifGlobal.effectifPrevu,
        formule: `${objectifGlobal.commerciauxActifs} commerciaux × ${objectifGlobal.objectifParCommercial} = ${objectifGlobal.objectifGlobal} soumissions/jour`,
      },
    };
  }
}
