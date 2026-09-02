import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SubmissionStatus, SubmissionType } from '@prisma/client';

interface ExportFilters {
  type?: SubmissionType;
  status?: SubmissionStatus;
  clusterId?: string;
  commercialId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Exporte les soumissions au format CSV.
   */
  async exportSubmissionsCsv(filters: ExportFilters, currentUser?: { role: Role; clusterId?: string | null }): Promise<string> {
    const submissions = await this.getSubmissionsForExport(filters, currentUser);

    // En-têtes CSV
    const headers = [
      'ID',
      'Type',
      'Statut',
      'Commercial',
      'Code Parrainage',
      'Cluster',
      'Commune',
      'Quartier',
      'Nom Prospect/Marchand',
      'Téléphone',
      'Latitude',
      'Longitude',
      'Date Création',
      'Date Soumission',
      'Validé Par',
      'Date Validation',
      'Motif Rejet',
    ];

    // Lignes de données
    const rows = submissions.map((s) => [
      s.id,
      s.type,
      s.status,
      s.commercial?.fullName || '',
      s.sponsorCode || '',
      s.clusterId || '',
      s.commune || '',
      s.quartier || '',
      s.type === 'PROSPECT' ? s.prospectFullName || '' : s.merchantName || '',
      s.type === 'PROSPECT' ? s.prospectPhone || '' : s.merchantPhone || '',
      s.latitude?.toString() || '',
      s.longitude?.toString() || '',
      s.createdAt ? new Date(s.createdAt).toISOString() : '',
      s.submittedAt ? new Date(s.submittedAt).toISOString() : '',
      s.validator?.fullName || '',
      s.validatedAt ? new Date(s.validatedAt).toISOString() : '',
      s.rejectionReason || '',
    ]);

    // Génération CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Exporte les soumissions au format PDF (retourne les données structurées pour génération PDF côté client).
   */
  async exportSubmissionsPdfData(filters: ExportFilters, currentUser?: { role: Role; clusterId?: string | null }) {
    const submissions = await this.getSubmissionsForExport(filters, currentUser);

    // Statistiques
    const stats = {
      total: submissions.length,
      prospects: submissions.filter((s) => s.type === 'PROSPECT').length,
      marchands: submissions.filter((s) => s.type === 'MARCHAND').length,
      validated: submissions.filter((s) => s.status === 'VALIDATED').length,
      rejected: submissions.filter((s) => s.status === 'REJECTED').length,
      pending: submissions.filter((s) => s.status === 'SUBMITTED').length,
    };

    // Données formatées pour le PDF
    const data = submissions.map((s) => ({
      id: s.id,
      type: s.type,
      status: s.status,
      commercial: s.commercial?.fullName || '',
      sponsorCode: s.sponsorCode || '',
      commune: s.commune || '',
      quartier: s.quartier || '',
      name: s.type === 'PROSPECT' ? s.prospectFullName || '' : s.merchantName || '',
      phone: s.type === 'PROSPECT' ? s.prospectPhone || '' : s.merchantPhone || '',
      createdAt: s.createdAt,
      submittedAt: s.submittedAt,
      validatedBy: s.validator?.fullName || '',
      validatedAt: s.validatedAt,
      rejectionReason: s.rejectionReason || '',
    }));

    return {
      generatedAt: new Date(),
      stats,
      data,
    };
  }

  /**
   * Exporte les commerciaux au format CSV.
   */
  async exportCommerciauxCsv(clusterId?: string, currentUser?: { role: Role; clusterId?: string | null }): Promise<string> {
    const where: Record<string, unknown> = {
      role: 'COMMERCIAL',
      deletedAt: null,
    };

    // Filtrage par cluster si spécifié ou selon le rôle
    if (clusterId) {
      where.clusterId = clusterId;
    } else if (currentUser?.role === Role.COORDINATEUR && currentUser.clusterId) {
      where.clusterId = currentUser.clusterId;
    }

    const commerciaux = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        matricule: true,
        fullName: true,
        phone: true,
        email: true,
        sponsorCode: true,
        status: true,
        isActive: true,
        createdAt: true,
        cluster: { select: { name: true } },
        supervisor: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // En-têtes CSV
    const headers = [
      'Matricule',
      'Nom Complet',
      'Téléphone',
      'Email',
      'Code Parrainage',
      'Cluster',
      'Superviseur',
      'Statut',
      'Actif',
      'Date Création',
    ];

    // Lignes de données
    const rows = commerciaux.map((c) => [
      c.matricule,
      c.fullName,
      c.phone,
      c.email || '',
      c.sponsorCode || '',
      c.cluster?.name || '',
      c.supervisor?.fullName || '',
      c.status,
      c.isActive ? 'Oui' : 'Non',
      new Date(c.createdAt).toISOString(),
    ]);

    // Génération CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Exporte les KPIs au format CSV.
   */
  async exportKpiCsv(dateFrom?: Date, dateTo?: Date, currentUser?: { role: Role; clusterId?: string | null }): Promise<string> {
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.createdAt as Record<string, Date>).lte = dateTo;
    }

    // Filtrage par cluster selon le rôle
    if (currentUser?.role === Role.COORDINATEUR && currentUser.clusterId) {
      where.clusterId = currentUser.clusterId;
    }

    // Récupérer les commerciaux avec leurs stats
    const commerciaux = await this.prisma.user.findMany({
      where: {
        role: 'COMMERCIAL',
        deletedAt: null,
        ...(currentUser?.role === Role.COORDINATEUR && currentUser.clusterId
          ? { clusterId: currentUser.clusterId }
          : {}),
      },
      select: {
        id: true,
        matricule: true,
        fullName: true,
        sponsorCode: true,
        cluster: { select: { name: true } },
        submissions: {
          where,
          select: {
            type: true,
            status: true,
          },
        },
      },
    });

    // En-têtes CSV
    const headers = [
      'Matricule',
      'Nom Complet',
      'Code Parrainage',
      'Cluster',
      'Total Soumissions',
      'Prospects',
      'Marchands',
      'Validés',
      'Rejetés',
      'En Attente',
      'Taux Validation (%)',
    ];

    // Lignes de données
    const rows = commerciaux.map((c) => {
      const total = c.submissions.length;
      const prospects = c.submissions.filter((s) => s.type === 'PROSPECT').length;
      const marchands = c.submissions.filter((s) => s.type === 'MARCHAND').length;
      const validated = c.submissions.filter((s) => s.status === 'VALIDATED').length;
      const rejected = c.submissions.filter((s) => s.status === 'REJECTED').length;
      const pending = c.submissions.filter((s) => s.status === 'SUBMITTED').length;
      const validationRate = total > 0 ? Math.round((validated / total) * 100) : 0;

      return [
        c.matricule,
        c.fullName,
        c.sponsorCode || '',
        c.cluster?.name || '',
        total,
        prospects,
        marchands,
        validated,
        rejected,
        pending,
        validationRate,
      ];
    });

    // Génération CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Récupère les soumissions pour l'export avec les filtres appliqués.
   */
  private async getSubmissionsForExport(filters: ExportFilters, currentUser?: { role: Role; clusterId?: string | null }) {
    const where: Record<string, unknown> = {};

    // Filtres
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.clusterId) where.clusterId = filters.clusterId;
    if (filters.commercialId) where.commercialId = filters.commercialId;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) (where.createdAt as Record<string, Date>).gte = filters.dateFrom;
      if (filters.dateTo) (where.createdAt as Record<string, Date>).lte = filters.dateTo;
    }

    // Filtrage par cluster selon le rôle du coordinateur
    if (currentUser?.role === Role.COORDINATEUR && currentUser.clusterId) {
      where.clusterId = currentUser.clusterId;
    }

    return this.prisma.submission.findMany({
      where,
      select: {
        id: true,
        type: true,
        status: true,
        clusterId: true,
        commune: true,
        quartier: true,
        latitude: true,
        longitude: true,
        prospectFullName: true,
        prospectPhone: true,
        merchantName: true,
        merchantPhone: true,
        sponsorCode: true,
        createdAt: true,
        submittedAt: true,
        validatedAt: true,
        rejectionReason: true,
        commercial: { select: { fullName: true, matricule: true } },
        validator: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
