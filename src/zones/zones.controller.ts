import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Controller('zones')
export class ZonesController {
  constructor(private zonesService: ZonesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  findAll(@CurrentUser() user: Omit<User, 'password'>) {
    return this.zonesService.findAllFiltered(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.findOne(id);
  }

  @Get(':id/quartiers-disponibles')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  getQuartiersDisponibles(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.getQuartiersDisponibles(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zonesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.zonesService.remove(id);
  }
}
