import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { UpdateSecteurDto } from './dto/update-secteur.dto';

@Injectable()
export class SecteursService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSecteurDto) {
    // Vérifier que la zone existe
    const zone = await this.prisma.zone.findUnique({
      where: { id: dto.zoneId },
    });
    if (!zone) throw new NotFoundException('Zone non trouvée');

    // Vérifier unicité du nom dans la zone
    const dup = await this.prisma.secteur.findUnique({
      where: { name_zoneId: { name: dto.name, zoneId: dto.zoneId } },
    });
    if (dup)
      throw new BadRequestException(
        'Un secteur avec ce nom existe déjà dans cette zone',
      );

    // Vérifier le superviseur
    if (dto.supervisorId) {
      await this.validateSupervisor(dto.supervisorId);
    }

    // Vérifier que les quartiers sont disponibles et appartiennent aux communes de la zone
    if (dto.quartierIds.length > 0) {
      await this.validateQuartiers(dto.quartierIds, dto.zoneId);
    }

    // Créer le secteur
    const secteur = await this.prisma.secteur.create({
      data: {
        name: dto.name,
        zoneId: dto.zoneId,
        supervisorId: dto.supervisorId || null,
      },
    });

    // Mettre à jour le secteurId et zoneId du superviseur
    if (dto.supervisorId) {
      await this.prisma.user.update({
        where: { id: dto.supervisorId },
        data: { secteurId: secteur.id, zoneId: dto.zoneId },
      });
    }

    // Affecter les quartiers
    if (dto.quartierIds.length > 0) {
      await this.prisma.quartier.updateMany({
        where: { id: { in: dto.quartierIds } },
        data: { secteurId: secteur.id },
      });
    }

    return this.findOne(secteur.id);
  }

  async findAll(zoneId?: string) {
    return this.prisma.secteur.findMany({
      where: zoneId ? { zoneId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        zone: { select: { id: true, name: true } },
        supervisor: { select: { id: true, fullName: true, matricule: true } },
        _count: { select: { quartiers: true, members: true } },
      },
    });
  }

  async findAllFiltered(
    currentUser: { role: string; zoneId?: string | null; secteurId?: string | null },
    zoneId?: string,
  ) {
    const where: Record<string, unknown> = {};

    switch (currentUser.role) {
      case Role.COORDINATEUR:
        where.zoneId = currentUser.zoneId;
        break;
      case Role.SUPERVISEUR:
        where.id = currentUser.secteurId;
        break;
      default:
        if (zoneId) where.zoneId = zoneId;
        break;
    }

    return this.prisma.secteur.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        zone: { select: { id: true, name: true } },
        supervisor: { select: { id: true, fullName: true, matricule: true } },
        _count: { select: { quartiers: true, members: true } },
      },
    });
  }

  async findOne(id: string) {
    const secteur = await this.prisma.secteur.findUnique({
      where: { id },
      include: {
        zone: { select: { id: true, name: true } },
        supervisor: { select: { id: true, fullName: true, matricule: true } },
        quartiers: {
          orderBy: { name: 'asc' },
          include: { commune: { select: { id: true, name: true } } },
        },
        members: {
          select: { id: true, fullName: true, matricule: true, isActive: true },
        },
        _count: { select: { quartiers: true, members: true } },
      },
    });

    if (!secteur) throw new NotFoundException('Secteur non trouvé');
    return secteur;
  }

  async update(id: string, dto: UpdateSecteurDto) {
    const secteur = await this.prisma.secteur.findUnique({ where: { id } });
    if (!secteur) throw new NotFoundException('Secteur non trouvé');

    // Vérifier unicité du nom si changé
    if (dto.name && dto.name !== secteur.name) {
      const dup = await this.prisma.secteur.findUnique({
        where: { name_zoneId: { name: dto.name, zoneId: secteur.zoneId } },
      });
      if (dup)
        throw new BadRequestException(
          'Un secteur avec ce nom existe déjà dans cette zone',
        );
    }

    // Normaliser supervisorId (string vide → null)
    const supervisorId = dto.supervisorId === '' ? null : dto.supervisorId;

    // Vérifier le superviseur
    if (supervisorId) {
      await this.validateSupervisor(supervisorId, id);
    }

    // Mettre à jour
    await this.prisma.secteur.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(supervisorId !== undefined && { supervisorId }),
      },
    });

    // Mettre à jour le secteurId et zoneId du superviseur (et retirer l'ancien)
    if (supervisorId !== undefined) {
      // Retirer l'ancien superviseur de ce secteur
      if (secteur.supervisorId && secteur.supervisorId !== supervisorId) {
        await this.prisma.user.update({
          where: { id: secteur.supervisorId },
          data: { secteurId: null, zoneId: null },
        });
      }
      // Assigner le nouveau superviseur à ce secteur avec la zoneId du secteur
      if (supervisorId) {
        await this.prisma.user.update({
          where: { id: supervisorId },
          data: { secteurId: id, zoneId: secteur.zoneId },
        });
      }
    }

    // Réaffecter les quartiers si fournis
    if (dto.quartierIds !== undefined) {
      // Libérer les anciens quartiers
      await this.prisma.quartier.updateMany({
        where: { secteurId: id },
        data: { secteurId: null },
      });

      if (dto.quartierIds.length > 0) {
        await this.validateQuartiers(dto.quartierIds, secteur.zoneId);
        await this.prisma.quartier.updateMany({
          where: { id: { in: dto.quartierIds } },
          data: { secteurId: id },
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const secteur = await this.prisma.secteur.findUnique({
      where: { id },
      select: { id: true, supervisorId: true },
    });
    if (!secteur) throw new NotFoundException('Secteur non trouvé');

    // GARDE-FOU CAS 2 : Refuser si des commerciaux actifs y sont rattachés
    const activeCommerciaux = await this.prisma.user.count({
      where: {
        secteurId: id,
        role: Role.COMMERCIAL,
        isActive: true,
      },
    });
    if (activeCommerciaux > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce secteur : ${activeCommerciaux} commercial(aux) actif(s) y sont rattachés. ` +
          `Réaffectez-les ou désactivez-les d'abord.`,
      );
    }

    // Libérer le superviseur si présent
    if (secteur.supervisorId) {
      await this.prisma.user.update({
        where: { id: secteur.supervisorId },
        data: { secteurId: null, zoneId: null },
      });
    }

    // Libérer les quartiers
    await this.prisma.quartier.updateMany({
      where: { secteurId: id },
      data: { secteurId: null },
    });

    return this.prisma.secteur.delete({ where: { id } });
  }

  private async validateSupervisor(
    supervisorId: string,
    excludeSecteurId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: supervisorId },
    });
    if (!user) throw new NotFoundException('Superviseur non trouvé');
    if (user.role !== Role.SUPERVISEUR) {
      throw new BadRequestException("L'utilisateur n'est pas un superviseur");
    }

    // Vérifier qu'il n'est pas déjà affecté à un autre secteur
    const otherSecteur = await this.prisma.secteur.findFirst({
      where: {
        supervisorId,
        ...(excludeSecteurId ? { id: { not: excludeSecteurId } } : {}),
      },
    });
    if (otherSecteur) {
      throw new BadRequestException(
        `Ce superviseur est déjà affecté au secteur "${otherSecteur.name}"`,
      );
    }
  }

  private async validateQuartiers(quartierIds: string[], zoneId: string) {
    // Récupérer les communes de la zone
    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: { communes: { select: { id: true } } },
    });
    if (!zone) throw new NotFoundException('Zone non trouvée');

    const communeIds = zone.communes.map((c) => c.id);

    // Vérifier que tous les quartiers appartiennent aux communes de la zone
    const quartiers = await this.prisma.quartier.findMany({
      where: { id: { in: quartierIds } },
      select: { id: true, name: true, communeId: true, secteurId: true },
    });

    if (quartiers.length !== quartierIds.length) {
      throw new BadRequestException('Certains quartiers sont introuvables');
    }

    const outsideZone = quartiers.filter(
      (q) => !communeIds.includes(q.communeId),
    );
    if (outsideZone.length > 0) {
      throw new BadRequestException(
        `Quartiers hors de la zone : ${outsideZone.map((q) => q.name).join(', ')}`,
      );
    }

    const taken = quartiers.filter((q) => q.secteurId !== null);
    if (taken.length > 0) {
      throw new BadRequestException(
        `Quartiers déjà affectés : ${taken.map((q) => q.name).join(', ')}`,
      );
    }
  }
}
