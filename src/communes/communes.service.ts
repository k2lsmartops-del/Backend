import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.commune.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { quartiers: true } },
        zone: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.commune.findUnique({
      where: { id },
      include: {
        quartiers: {
          orderBy: { name: 'asc' },
          include: { secteur: { select: { id: true, name: true } } },
        },
        zone: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Récupère les communes et quartiers de la zone de l'utilisateur.
   * Pour les commerciaux : retourne les communes de leur zone avec tous les quartiers.
   * Permet la sélection rapide lors de la création de soumission.
   */
  async findByUserZone(user: User) {
    if (!user.zoneId) {
      return { communes: [], message: 'Aucune zone assignée' };
    }

    const communes = await this.prisma.commune.findMany({
      where: { zoneId: user.zoneId },
      orderBy: { name: 'asc' },
      include: {
        quartiers: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            secteurId: true,
          },
        },
      },
    });

    // Récupérer aussi le nom de la zone
    const zone = await this.prisma.zone.findUnique({
      where: { id: user.zoneId },
      select: { id: true, name: true },
    });

    return {
      zone,
      communes: communes.map((c) => ({
        id: c.id,
        name: c.name,
        quartiers: c.quartiers,
      })),
    };
  }
}
