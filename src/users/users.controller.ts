import {
  Body,
  Controller,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

/**
 * Contrôleur de gestion des utilisateurs.
 * La plupart des routes sont réservées à l'ADMIN.
 * Certaines routes sont accessibles aux SUPERVISEURS.
 */
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /users/team — Récupère l'équipe du superviseur connecté.
   * Accessible uniquement aux SUPERVISEURS.
   */
  @Get('team')
  @Roles(Role.SUPERVISEUR)
  getTeam(@CurrentUser() user: Omit<User, 'password'>) {
    return this.usersService.getTeam(user.id);
  }

  /**
   * POST /users — Créer un utilisateur (tout type de rôle).
   */
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /**
   * GET /users — Liste paginée avec filtres.
   */
  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  /**
   * GET /users/:id — Détail d'un utilisateur.
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * PATCH /users/:id — Mettre à jour un utilisateur.
   */
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  /**
   * PATCH /users/:id/deactivate — Désactiver un utilisateur (soft delete).
   */
  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * PATCH /users/:id/activate — Réactiver un utilisateur.
   */
  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }

  /**
   * PATCH /users/:id/suspend — Suspendre un utilisateur.
   */
  @Patch(':id/suspend')
  @Roles(Role.ADMIN)
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.suspend(id);
  }
}
