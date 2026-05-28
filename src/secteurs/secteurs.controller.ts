import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SecteursService } from './secteurs.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { UpdateSecteurDto } from './dto/update-secteur.dto';

@Controller('secteurs')
export class SecteursController {
  constructor(private secteursService: SecteursService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  create(@Body() dto: CreateSecteurDto) {
    return this.secteursService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  findAll(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.secteursService.findAllFiltered(user, zoneId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.secteursService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSecteurDto,
  ) {
    return this.secteursService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.secteursService.remove(id);
  }
}
