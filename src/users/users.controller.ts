import {
  Body,
  Controller,
  ForbiddenException,
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
    return this.usersService.getTeam(user.id, user.clusterId);
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
   * @deprecated Utiliser DELETE /users/:id à la place
   */
  @Patch(':id/suspend')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.suspend(id);
  }

  /**
   * PATCH /users/:id/delete — Supprimer un utilisateur (soft-delete).
   * Les données sont conservées en BDD mais le compte n'apparaît plus dans les listings.
   * 
   * Permissions :
   * - ADMIN : peut supprimer tout utilisateur (sauf ADMIN)
   * - COORDINATEUR : peut supprimer superviseurs et commerciaux
   * - SUPERVISEUR : peut supprimer uniquement ses commerciaux
   */
  @Patch(':id/delete')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  softDelete(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.softDelete(id, currentUser);
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

  /**
   * GET /users/:id/stats — Statistiques d'un utilisateur.
   * SUPERVISEUR peut voir uniquement ses commerciaux.
   */
  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  getStats(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.getStats(id, currentUser);
  }

  /**
   * GET /users/:id/payment — Informations de paiement d'un utilisateur.
   * SUPERVISEUR peut voir uniquement ses commerciaux.
   */
  @Get(':id/payment')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR)
  getPayment(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.usersService.getPayment(id, currentUser);
  }

  /**
   * PATCH /users/:id/change-password — Changer son propre mot de passe.
   * Accessible à tous les utilisateurs authentifiés (ADMIN, COORDINATEUR, SUPERVISEUR, COMMERCIAL).
   * L'utilisateur ne peut modifier que son propre mot de passe.
   */
  @Patch(':id/change-password')
  changePassword(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { password: string },
  ) {
    // Vérifier que l'utilisateur modifie son propre mot de passe
    if (id !== currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre mot de passe');
    }
    return this.usersService.changePassword(id, body.password);
  }

  /**
   * PATCH /users/:id/profile — Modifier ses propres informations personnelles.
   * Accessible à tous les utilisateurs authentifiés (ADMIN, COORDINATEUR, SUPERVISEUR, COMMERCIAL).
   * L'utilisateur ne peut modifier que ses propres informations (fullName, gender, phone, email).
   */
  @Patch(':id/profile')
  updateProfile(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { fullName?: string; gender?: string; phone?: string; email?: string },
  ) {
    // Vérifier que l'utilisateur modifie son propre profil
    if (id !== currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
    }
    return this.usersService.updateProfile(id, body);
  }

  /**
   * POST /users/:id/two-factor/enable — Activer l'authentification à double facteur.
   * Retourne un QR code et un secret pour configurer l'application d'authentification.
   */
  @Post(':id/two-factor/enable')
  enableTwoFactor(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (id !== currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez activer le 2FA que pour votre propre compte');
    }
    return this.usersService.enableTwoFactor(id);
  }

  /**
   * POST /users/:id/two-factor/verify — Vérifier le code 2FA et activer définitivement.
   */
  @Post(':id/two-factor/verify')
  verifyTwoFactor(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { token: string },
  ) {
    if (id !== currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez vérifier le 2FA que pour votre propre compte');
    }
    return this.usersService.verifyAndActivateTwoFactor(id, body.token);
  }

  /**
   * POST /users/:id/two-factor/disable — Désactiver l'authentification à double facteur.
   */
  @Post(':id/two-factor/disable')
  disableTwoFactor(
    @CurrentUser() currentUser: Omit<User, 'password'>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { token: string },
  ) {
    if (id !== currentUser.id) {
      throw new ForbiddenException('Vous ne pouvez désactiver le 2FA que pour votre propre compte');
    }
    return this.usersService.disableTwoFactor(id, body.token);
  }

  /**
   * GET /me/kpi-today — Récupère les KPI du jour pour l'utilisateur connecté.
   * Retourne le nombre de soumissions du jour par type et l'objectif quotidien.
   */
  @Get('me/kpi-today')
  getTodayKpi(@CurrentUser() user: Omit<User, 'password'>) {
    return this.usersService.getTodayKpi(user.id);
  }
}
