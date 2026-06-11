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
import { AssignSupervisorDto } from './dto/assign-supervisor.dto';

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

  /**
   * Assigne ou remplace le superviseur d'un cluster.
   * Met automatiquement à jour tous les commerciaux du cluster.
   */
  @Patch(':id/supervisor')
  @Roles(Role.ADMIN)
  assignSupervisor(
    @Param('id', ParseUUIDPipe) clusterId: string,
    @Body() dto: AssignSupervisorDto,
  ) {
    return this.clustersService.assignSupervisor(clusterId, dto.supervisorId);
  }

  /**
   * Retire le superviseur d'un cluster.
   * Refuse si le cluster contient des commerciaux actifs.
   */
  @Delete(':id/supervisor')
  @Roles(Role.ADMIN)
  removeSupervisor(@Param('id', ParseUUIDPipe) clusterId: string) {
    return this.clustersService.removeSupervisor(clusterId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clustersService.remove(id);
  }
}
