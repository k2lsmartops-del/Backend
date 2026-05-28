import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateZoneDto) {
    // Vérifier unicité du nom
    const existing = await this.prisma.zone.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Une zone avec ce nom existe déjà');
    }

    // Vérifier le coordinateur (s'il est fourni)
    if (dto.coordinatorId) {
      await this.validateCoordinator(dto.coordinatorId);
    }

    // Vérifier que les communes ne sont pas déjà prises
    if (dto.communeIds.length > 0) {
      const taken = await this.prisma.commune.findMany({
        where: { id: { in: dto.communeIds }, zoneId: { not: null } },
        select: { name: true },
      });
      if (taken.length > 0) {
        throw new BadRequestException(
          `Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`,
        );
      }
    }

    // Créer la zone
    const zone = await this.prisma.zone.create({
      data: {
        name: dto.name,
        description: dto.description,
        coordinatorId: dto.coordinatorId || null,
      },
    });

    // Mettre à jour le zoneId du coordinateur
    if (dto.coordinatorId) {
      await this.prisma.user.update({
        where: { id: dto.coordinatorId },
        data: { zoneId: zone.id },
      });
    }

    // Affecter les communes
    if (dto.communeIds.length > 0) {
      await this.prisma.commune.updateMany({
        where: { id: { in: dto.communeIds } },
        data: { zoneId: zone.id },
      });
    }

    return this.findOne(zone.id);
  }

  async findAll() {
    return this.prisma.zone.findMany({
      orderBy: { name: 'asc' },
      include: {
        coordinator: { select: { id: true, fullName: true, matricule: true } },
        communes: { select: { id: true, name: true } },
        _count: { select: { secteurs: true, members: true } },
      },
    });
  }

  async findAllFiltered(
    currentUser: { role: string; zoneId?: string | null },
  ) {
    const where: Record<string, unknown> = {};

    if (currentUser.role === Role.COORDINATEUR && currentUser.zoneId) {
      where.id = currentUser.zoneId;
    }

    return this.prisma.zone.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        coordinator: { select: { id: true, fullName: true, matricule: true } },
        communes: { select: { id: true, name: true } },
        _count: { select: { secteurs: true, members: true } },
      },
    });
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        coordinator: { select: { id: true, fullName: true, matricule: true } },
        communes: {
          select: { id: true, name: true, _count: { select: { quartiers: true } } },
          orderBy: { name: 'asc' },
        },
        secteurs: {
          select: {
            id: true,
            name: true,
            supervisor: { select: { id: true, fullName: true, matricule: true } },
            _count: { select: { quartiers: true, members: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { members: true } },
      },
    });

    if (!zone) throw new NotFoundException('Zone non trouvée');
    return zone;
  }

  async update(id: string, dto: UpdateZoneDto) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) throw new NotFoundException('Zone non trouvée');

    // Vérifier unicité du nom si changé
    if (dto.name && dto.name !== zone.name) {
      const dup = await this.prisma.zone.findUnique({ where: { name: dto.name } });
      if (dup) throw new ConflictException('Une zone avec ce nom existe déjà');
    }

    // Normaliser coordinatorId (string vide → null)
    const coordinatorId = dto.coordinatorId === '' ? null : dto.coordinatorId;

    // Vérifier le coordinateur
    if (coordinatorId) {
      await this.validateCoordinator(coordinatorId, id);
    }

    // Mettre à jour les champs simples
    await this.prisma.zone.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(coordinatorId !== undefined && { coordinatorId }),
      },
    });

    // Mettre à jour le zoneId du coordinateur (et retirer l'ancien)
    if (coordinatorId !== undefined) {
      // Retirer l'ancien coordinateur de cette zone
      if (zone.coordinatorId && zone.coordinatorId !== coordinatorId) {
        await this.prisma.user.update({
          where: { id: zone.coordinatorId },
          data: { zoneId: null },
        });
      }
      // Assigner le nouveau coordinateur à cette zone
      if (coordinatorId) {
        await this.prisma.user.update({
          where: { id: coordinatorId },
          data: { zoneId: id },
        });
      }
    }

    // Réaffecter les communes si fournies
    if (dto.communeIds !== undefined) {
      // Récupérer les communes actuelles de la zone
      const currentCommunes = await this.prisma.commune.findMany({
        where: { zoneId: id },
        select: { id: true, name: true },
      });
      const currentCommuneIds = currentCommunes.map((c) => c.id);

      // Identifier les communes retirées
      const removedCommuneIds = currentCommuneIds.filter(
        (cid) => !dto.communeIds!.includes(cid),
      );

      // GARDE-FOU CAS 1 : Vérifier qu'aucun secteur n'a de quartiers des communes retirées
      if (removedCommuneIds.length > 0) {
        const blockedSecteurs = await this.prisma.secteur.findMany({
          where: {
            zoneId: id,
            quartiers: {
              some: { communeId: { in: removedCommuneIds } },
            },
          },
          select: {
            name: true,
            quartiers: {
              where: { communeId: { in: removedCommuneIds } },
              select: { communeId: true },
            },
          },
        });

        if (blockedSecteurs.length > 0) {
          const removedCommuneNames = currentCommunes
            .filter((c) => removedCommuneIds.includes(c.id))
            .map((c) => c.name);
          const details = blockedSecteurs
            .map((s) => `${s.name} (${s.quartiers.length} quartier(s))`)
            .join(', ');
          throw new BadRequestException(
            `Impossible de retirer ${removedCommuneNames.join(', ')}. ` +
              `Secteurs concernés : ${details}. ` +
              `Modifiez ou supprimez ces secteurs d'abord.`,
          );
        }
      }

      // Libérer les anciennes communes de cette zone
      await this.prisma.commune.updateMany({
        where: { zoneId: id },
        data: { zoneId: null },
      });

      // Vérifier que les nouvelles ne sont pas prises par une autre zone
      if (dto.communeIds.length > 0) {
        const taken = await this.prisma.commune.findMany({
          where: { id: { in: dto.communeIds }, zoneId: { not: null } },
          select: { name: true },
        });
        if (taken.length > 0) {
          throw new BadRequestException(
            `Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`,
          );
        }

        await this.prisma.commune.updateMany({
          where: { id: { in: dto.communeIds } },
          data: { zoneId: id },
        });
      }
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        coordinatorId: true,
        _count: { select: { secteurs: true } },
      },
    });
    if (!zone) throw new NotFoundException('Zone non trouvée');

    // GARDE-FOU CAS 3 : Refuser si la zone contient des secteurs
    if (zone._count.secteurs > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette zone : elle contient ${zone._count.secteurs} secteur(s). ` +
          `Supprimez-les d'abord.`,
      );
    }

    // Libérer le coordinateur si présent
    if (zone.coordinatorId) {
      await this.prisma.user.update({
        where: { id: zone.coordinatorId },
        data: { zoneId: null },
      });
    }

    // Libérer les communes
    await this.prisma.commune.updateMany({
      where: { zoneId: id },
      data: { zoneId: null },
    });

    return this.prisma.zone.delete({ where: { id } });
  }

  async getQuartiersDisponibles(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
      include: { communes: { select: { id: true } } },
    });
    if (!zone) throw new NotFoundException('Zone non trouvée');

    const communeIds = zone.communes.map((c) => c.id);

    return this.prisma.quartier.findMany({
      where: {
        communeId: { in: communeIds },
        secteurId: null,
      },
      orderBy: { name: 'asc' },
      include: { commune: { select: { id: true, name: true } } },
    });
  }

  private async validateCoordinator(coordinatorId: string, excludeZoneId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: coordinatorId } });
    if (!user) throw new NotFoundException('Coordinateur non trouvé');
    if (user.role !== Role.COORDINATEUR) {
      throw new BadRequestException("L'utilisateur n'est pas un coordinateur");
    }

    // Vérifier qu'il n'est pas déjà affecté à une autre zone
    const otherZone = await this.prisma.zone.findFirst({
      where: {
        coordinatorId,
        ...(excludeZoneId ? { id: { not: excludeZoneId } } : {}),
      },
    });
    if (otherZone) {
      throw new BadRequestException(
        `Ce coordinateur est déjà affecté à la zone "${otherZone.name}"`,
      );
    }
  }
}
