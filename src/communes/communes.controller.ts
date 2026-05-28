import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CommunesService } from './communes.service';

@Controller('communes')
export class CommunesController {
  constructor(private communesService: CommunesService) {}

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
