import { Controller, Get, Query, Header, StreamableFile } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  /**
   * GET /export/submissions/csv — Exporte les soumissions au format CSV.
   */
  @Get('submissions/csv')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="soumissions.csv"')
  async exportSubmissionsCsv(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('clusterId') clusterId?: string,
    @Query('commercialId') commercialId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<StreamableFile> {
    const filters = {
      type: type as any,
      status: status as any,
      clusterId,
      commercialId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    const csv = await this.exportService.exportSubmissionsCsv(filters, user);
    const buffer = Buffer.from('\uFEFF' + csv, 'utf-8'); // BOM pour Excel
    return new StreamableFile(buffer);
  }

  /**
   * GET /export/submissions/pdf — Retourne les données pour génération PDF côté client.
   */
  @Get('submissions/pdf')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  async exportSubmissionsPdf(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('clusterId') clusterId?: string,
    @Query('commercialId') commercialId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters = {
      type: type as any,
      status: status as any,
      clusterId,
      commercialId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };

    return this.exportService.exportSubmissionsPdfData(filters, user);
  }

  /**
   * GET /export/commerciaux/csv — Exporte les commerciaux au format CSV.
   */
  @Get('commerciaux/csv')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="commerciaux.csv"')
  async exportCommerciauxCsv(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('clusterId') clusterId?: string,
  ): Promise<StreamableFile> {
    const csv = await this.exportService.exportCommerciauxCsv(clusterId, user);
    const buffer = Buffer.from('\uFEFF' + csv, 'utf-8');
    return new StreamableFile(buffer);
  }

  /**
   * GET /export/kpi/csv — Exporte les KPIs par commercial au format CSV.
   */
  @Get('kpi/csv')
  @Roles(Role.ADMIN, Role.COORDINATEUR)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="kpi.csv"')
  async exportKpiCsv(
    @CurrentUser() user: Omit<User, 'password'>,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<StreamableFile> {
    const csv = await this.exportService.exportKpiCsv(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      user,
    );
    const buffer = Buffer.from('\uFEFF' + csv, 'utf-8');
    return new StreamableFile(buffer);
  }
}
