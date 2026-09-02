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
import { Throttle } from '@nestjs/throttler';
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
 *  - PATCH  /submissions/:id/validate — Validation (coordinateur)
 *  - PATCH  /submissions/:id/reject   — Rejet (coordinateur)
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
  // 200/min : la sync offline de la PWA peut envoyer plusieurs lots d'affilée
  // au retour de connexion (rattrapage). Limite élargie pour ne pas bloquer
  // un commercial qui resynchronise une journée de terrain.
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Post('sync')
  @Roles(Role.COMMERCIAL)
  sync(
    @Body() dto: SyncSubmissionsDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.syncBatch(dto.submissions, user);
  }

  /**
   * GET /submissions/stats — Statistiques pour le dashboard.
   * Filtrées automatiquement selon le rôle de l'utilisateur.
   */
  // 200/min : le dashboard peut rafraîchir les KPIs en polling. Réponse
  // servie depuis le cache mémoire dans la majorité des cas (TTL 5 min).
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Get('stats')
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR, Role.CLIENT)
  getStats(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('clusterId') clusterId?: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.submissionsService.getStats(user, clusterId, period || 'day');
  }

  /**
   * GET /submissions — Liste paginée des soumissions.
   * Filtrée automatiquement selon le rôle de l'utilisateur.
   * CLIENT ne voit que les soumissions validées.
   */
  // 200/min : liste consultée fréquemment (polling possible côté frontend,
  // pagination, rafraîchissement après validation).
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Get()
  @Roles(Role.ADMIN, Role.COORDINATEUR, Role.SUPERVISEUR, Role.COMMERCIAL, Role.CLIENT)
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
   * PATCH /submissions/:id/validate — Validation par le coordinateur.
   * Workflow simplifié à 1 niveau.
   */
  @Patch(':id/validate')
  @Roles(Role.COORDINATEUR, Role.ADMIN)
  validate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidateSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.validate(id, user, dto?.comment);
  }

  /**
   * PATCH /submissions/:id/reject — Rejet par le coordinateur.
   * Workflow simplifié à 1 niveau.
   */
  @Patch(':id/reject')
  @Roles(Role.COORDINATEUR, Role.ADMIN)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectSubmissionDto,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.reject(id, user, dto.comment);
  }

  /**
   * POST /submissions/:id/resubmit — Re-soumettre une soumission rejetée.
   * Réservé au COMMERCIAL propriétaire de la soumission.
   */
  @Post(':id/resubmit')
  @Roles(Role.COMMERCIAL)
  resubmit(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: Omit<User, 'password'>,
  ) {
    return this.submissionsService.resubmit(id, user);
  }
}
