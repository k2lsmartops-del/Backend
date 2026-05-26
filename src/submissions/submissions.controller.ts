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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';
import { SyncSubmissionsDto } from './dto/sync-submission.dto';
import { ValidateSubmissionDto } from './dto/validate-submission.dto';
import { RejectSubmissionDto } from './dto/reject-submission.dto';

/**
 * Contrôleur des soumissions terrain (prospects + marchands).
 *
 * Routes :
 *  - POST   /submissions        — Créer une soumission (COMMERCIAL)
 *  - POST   /submissions/sync   — Sync batch offline (COMMERCIAL)
 *  - GET    /submissions        — Liste paginée (filtrée par rôle)
 *  - GET    /submissions/:id    — Détail
 *  - PATCH  /submissions/:id/approve-l1 — Validation superviseur
 *  - PATCH  /submissions/:id/reject-l1  — Rejet superviseur
 *  - PATCH  /submissions/:id/approve-l2 — Validation coordinateur
 *  - PATCH  /submissions/:id/reject-l2  — Rejet coordinateur
 */
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  /**
   * POST /submissions — Créer une soumission.
   * Réservé au COMMERCIAL.
   */
  @Post()
  @Roles(Role.COMMERCIAL)
  create(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.create(dto, user);
  }

  /**
   * POST /submissions/sync — Synchronisation batch (offline → online).
   * Réservé au COMMERCIAL.
   */
  @Post('sync')
  @Roles(Role.COMMERCIAL)
  sync(
    @Body() dto: SyncSubmissionsDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.syncBatch(dto.submissions, user);
  }

  /**
   * GET /submissions — Liste paginée des soumissions.
   * Filtrée automatiquement selon le rôle de l'utilisateur.
   */
  @Get()
  findAll(
    @Query() query: QuerySubmissionsDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.findAll(query, user);
  }

  /**
   * GET /submissions/:id/check-editable — Vérifie si la soumission est modifiable.
   * Retourne { editable: boolean, status: string }.
   */
  @Get(':id/check-editable')
  @Roles(Role.COMMERCIAL)
  checkEditable(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.checkEditable(id, user);
  }

  /**
   * GET /submissions/:id — Détail d'une soumission.
   */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.findOne(id, user);
  }

  /**
   * PATCH /submissions/:id — Modifier une soumission (DRAFT ou SUBMITTED uniquement).
   * Réservé au COMMERCIAL propriétaire.
   */
  @Patch(':id')
  @Roles(Role.COMMERCIAL)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.update(id, dto, user);
  }

  /**
   * DELETE /submissions/:id — Supprimer une soumission (DRAFT ou SUBMITTED uniquement).
   * Réservé au COMMERCIAL propriétaire.
   */
  @Delete(':id')
  @Roles(Role.COMMERCIAL)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.remove(id, user);
  }

  /**
   * PATCH /submissions/:id/approve-l1 — Validation NIVEAU 1 (superviseur).
   */
  @Patch(':id/approve-l1')
  @Roles(Role.SUPERVISEUR, Role.ADMIN)
  approveLevel1(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidateSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.approveLevel1(id, user, dto?.comment);
  }

  /**
   * PATCH /submissions/:id/reject-l1 — Rejet NIVEAU 1 (superviseur).
   */
  @Patch(':id/reject-l1')
  @Roles(Role.SUPERVISEUR, Role.ADMIN)
  rejectLevel1(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.rejectLevel1(id, user, dto.comment);
  }

  /**
   * PATCH /submissions/:id/approve-l2 — Validation NIVEAU 2 (coordinateur).
   */
  @Patch(':id/approve-l2')
  @Roles(Role.COORDINATEUR, Role.ADMIN)
  approveLevel2(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidateSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.approveLevel2(id, user, dto?.comment);
  }

  /**
   * PATCH /submissions/:id/reject-l2 — Rejet NIVEAU 2 (coordinateur).
   */
  @Patch(':id/reject-l2')
  @Roles(Role.COORDINATEUR, Role.ADMIN)
  rejectLevel2(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.rejectLevel2(id, user, dto.comment);
  }
}
