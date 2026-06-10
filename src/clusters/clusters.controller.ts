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
import { ClustersService } from './clusters.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { UpdateClusterDto } from './dto/update-cluster.dto';

@Controller('clusters')
export class ClustersController {
  constructor(private clustersService: ClustersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  create(@Body() dto: CreateClusterDto) {
    return this.clustersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  findAll(@CurrentUser() user: Omit<User, 'password'>) {
    return this.clustersService.findAllFiltered(user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clustersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClusterDto,
  ) {
    return this.clustersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clustersService.remove(id);
  }
}
