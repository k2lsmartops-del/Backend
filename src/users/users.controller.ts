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
import { BulkImportDto } from './dto/bulk-import.dto';

/**
 * Contrôleur de gestion des utilisateurs.
 * ADMIN et COORDINATEUR peuvent gérer tous les utilisateurs.
 * SUPERVISEUR peut gérer uniquement ses commerciaux.
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
   * POST /users/bulk-import — Import en masse d'une équipe complète.
   * Réservé à l'ADMIN. Crée coordinateurs/clusters, superviseurs et commerciaux.
   */
  @Post('bulk-import')
  @Roles(Role.ADMIN)
  bulkImport(@Body() dto: BulkImportDto) {
    return this.usersService.bulkImport(dto.rows);
  }

  /**
   * POST /users — Créer un utilisateur.
   * SUPERVISEUR ne peut créer que des COMMERCIAL dans son cluster.
   */
  @Post()
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  create(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(dto, currentUser);
  }

  /**
   * GET /users — Liste paginée avec filtres.
   * Le service filtre automatiquement selon le rôle du demandeur.
   */
  @Get()
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  findAll(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query() query: QueryUsersDto,
  ) {
    return this.usersService.findAll(query, user);
  }

  /**
   * GET /users/:id — Détail d'un utilisateur.
   * SUPERVISEUR peut voir uniquement ses commerciaux.
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  findOne(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.findOne(id, currentUser);
  }

  /**
   * PATCH /users/:id — Mettre à jour un utilisateur.
   * SUPERVISEUR peut modifier uniquement ses commerciaux.
   */
  @Patch(':id')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  update(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto, currentUser);
  }

  /**
   * PATCH /users/:id/deactivate — Désactiver un utilisateur (soft delete).
   * SUPERVISEUR peut désactiver uniquement ses commerciaux.
   */
  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  deactivate(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.deactivate(id, currentUser);
  }

  /**
   * PATCH /users/:id/activate — Réactiver un utilisateur.
   * SUPERVISEUR peut réactiver uniquement ses commerciaux.
   */
  @Patch(':id/activate')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  activate(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.activate(id, currentUser);
  }

  /**
   * PATCH /users/:id/suspend — Suspendre un utilisateur.
   */
  @Patch(':id/suspend')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.suspend(id);
  }

  /**
   * POST /users/:id/reset-password — Régénérer le mot de passe.
   * SUPERVISEUR peut réinitialiser le mot de passe de ses commerciaux.
   */
  @Post(':id/reset-password')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  resetPassword(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.resetPassword(id, currentUser);
  }

  /**
   * PATCH /users/:id/remove-from-team — Retirer un commercial de l'équipe.
   * Met supervisorId à null.
   */
  @Patch(':id/remove-from-team')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  removeFromTeam(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.removeFromTeam(id, currentUser);
  }

}
