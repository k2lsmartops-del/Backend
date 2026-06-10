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
        cluster: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.commune.findUnique({
      where: { id },
      include: {
        quartiers: {
          orderBy: { name: 'asc' },
        },
        cluster: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Récupère les communes et quartiers du cluster de l'utilisateur.
   * Pour les commerciaux : retourne les communes de leur cluster avec tous les quartiers.
   * Permet la sélection rapide lors de la création de soumission.
   */
  async findByUserCluster(user: User) {
    if (!user.clusterId) {
      return { communes: [], message: 'Aucun cluster assigné' };
    }

    const communes = await this.prisma.commune.findMany({
      where: { clusterId: user.clusterId },
      orderBy: { name: 'asc' },
      include: {
        quartiers: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Récupérer aussi le nom du cluster
    const cluster = await this.prisma.cluster.findUnique({
      where: { id: user.clusterId },
      select: { id: true, name: true },
    });

    return {
      cluster,
      communes: communes.map((c) => ({
        id: c.id,
        name: c.name,
        quartiers: c.quartiers,
      })),
    };
  }
}
