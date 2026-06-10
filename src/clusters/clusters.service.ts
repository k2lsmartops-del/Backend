import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { UpdateClusterDto } from './dto/update-cluster.dto';

@Injectable()
export class ClustersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un cluster (ADMIN ou COORDINATEUR)
   */
  async create(dto: CreateClusterDto) {
    // Vérifier unicité du nom
    const existing = await this.prisma.cluster.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Un cluster avec ce nom existe déjà');
    }

    // Vérifier le superviseur (s'il est fourni)
    if (dto.supervisorId) {
      await this.validateSupervisor(dto.supervisorId);
    }

    // Vérifier que les communes ne sont pas déjà prises
    if (dto.communeIds && dto.communeIds.length > 0) {
      const taken = await this.prisma.commune.findMany({
        where: { id: { in: dto.communeIds }, clusterId: { not: null } },
        select: { name: true },
      });
      if (taken.length > 0) {
        throw new BadRequestException(
          `Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`,
        );
      }
    }

    // Créer le cluster
    const cluster = await this.prisma.cluster.create({
      data: {
        name: dto.name,
        description: dto.description,
        supervisorId: dto.supervisorId || null,
      },
    });

    // Mettre à jour le clusterId du superviseur
    if (dto.supervisorId) {
      await this.prisma.user.update({
        where: { id: dto.supervisorId },
        data: { clusterId: cluster.id },
      });
    }

    // Affecter les communes
    if (dto.communeIds && dto.communeIds.length > 0) {
      await this.prisma.commune.updateMany({
        where: { id: { in: dto.communeIds } },
        data: { clusterId: cluster.id },
      });
    }

    return this.findOne(cluster.id);
  }

  /**
   * Liste tous les clusters (ADMIN, COORDINATEUR)
   */
  async findAll() {
    return this.prisma.cluster.findMany({
      orderBy: { name: 'asc' },
      include: {
        supervisor: { select: { id: true, fullName: true, matricule: true, phone: true } },
        communes: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
    });
  }

  /**
   * Liste filtrée selon le rôle
   * - ADMIN/COORDINATEUR : tous les clusters
   * - SUPERVISEUR : uniquement son cluster
   */
  async findAllFiltered(currentUser: { role: string; clusterId?: string | null }) {
    // SUPERVISEUR ne voit que son cluster
    if (currentUser.role === Role.SUPERVISEUR && currentUser.clusterId) {
      return this.prisma.cluster.findMany({
        where: { id: currentUser.clusterId },
        orderBy: { name: 'asc' },
        include: {
          supervisor: { select: { id: true, fullName: true, matricule: true, phone: true } },
          communes: { select: { id: true, name: true } },
          _count: { select: { members: true } },
        },
      });
    }

    // ADMIN et COORDINATEUR voient tout
    return this.findAll();
  }

  /**
   * Détail d'un cluster
   */
  async findOne(id: string) {
    const cluster = await this.prisma.cluster.findUnique({
      where: { id },
      include: {
        supervisor: { select: { id: true, fullName: true, matricule: true, phone: true } },
        communes: {
          select: { id: true, name: true, _count: { select: { quartiers: true } } },
          orderBy: { name: 'asc' },
        },
        members: {
          select: { id: true, fullName: true, matricule: true, phone: true, role: true, isActive: true },
          orderBy: { fullName: 'asc' },
        },
        _count: { select: { members: true } },
      },
    });

    if (!cluster) throw new NotFoundException('Cluster non trouvé');
    return cluster;
  }

  /**
   * Mettre à jour un cluster (ADMIN ou COORDINATEUR)
   */
  async update(id: string, dto: UpdateClusterDto) {
    const cluster = await this.prisma.cluster.findUnique({ where: { id } });
    if (!cluster) throw new NotFoundException('Cluster non trouvé');

    // Vérifier unicité du nom si changé
    if (dto.name && dto.name !== cluster.name) {
      const dup = await this.prisma.cluster.findUnique({ where: { name: dto.name } });
      if (dup) throw new ConflictException('Un cluster avec ce nom existe déjà');
    }

    // Normaliser supervisorId (string vide → null)
    const supervisorId = dto.supervisorId === '' ? null : dto.supervisorId;

    // Vérifier le superviseur
    if (supervisorId) {
      await this.validateSupervisor(supervisorId, id);
    }

    // Mettre à jour les champs simples
    await this.prisma.cluster.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(supervisorId !== undefined && { supervisorId }),
      },
    });

    // Mettre à jour le clusterId du superviseur (et retirer l'ancien)
    if (supervisorId !== undefined) {
      // Retirer l'ancien superviseur de ce cluster
      if (cluster.supervisorId && cluster.supervisorId !== supervisorId) {
        await this.prisma.user.update({
          where: { id: cluster.supervisorId },
          data: { clusterId: null },
        });
      }
      // Assigner le nouveau superviseur à ce cluster
      if (supervisorId) {
        await this.prisma.user.update({
          where: { id: supervisorId },
          data: { clusterId: id },
        });
      }
    }

    // Réaffecter les communes si fournies
    if (dto.communeIds !== undefined) {
      // Libérer les anciennes communes de ce cluster
      await this.prisma.commune.updateMany({
        where: { clusterId: id },
        data: { clusterId: null },
      });

      // Vérifier que les nouvelles ne sont pas prises par un autre cluster
      if (dto.communeIds.length > 0) {
        const taken = await this.prisma.commune.findMany({
          where: { id: { in: dto.communeIds }, clusterId: { not: null } },
          select: { name: true },
        });
        if (taken.length > 0) {
          throw new BadRequestException(
            `Communes déjà affectées : ${taken.map((c) => c.name).join(', ')}`,
          );
        }

        await this.prisma.commune.updateMany({
          where: { id: { in: dto.communeIds } },
          data: { clusterId: id },
        });
      }
    }

    return this.findOne(id);
  }

  /**
   * Supprimer un cluster (ADMIN uniquement)
   */
  async remove(id: string) {
    const cluster = await this.prisma.cluster.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        supervisorId: true,
        _count: { select: { members: true } },
      },
    });
    if (!cluster) throw new NotFoundException('Cluster non trouvé');

    // GARDE-FOU : Refuser si le cluster contient des membres
    if (cluster._count.members > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce cluster : il contient ${cluster._count.members} membre(s). ` +
          `Réaffectez-les d'abord.`,
      );
    }

    // Libérer le superviseur si présent
    if (cluster.supervisorId) {
      await this.prisma.user.update({
        where: { id: cluster.supervisorId },
        data: { clusterId: null },
      });
    }

    // Libérer les communes
    await this.prisma.commune.updateMany({
      where: { clusterId: id },
      data: { clusterId: null },
    });

    return this.prisma.cluster.delete({ where: { id } });
  }

  /**
   * Valide qu'un utilisateur peut être superviseur d'un cluster
   */
  private async validateSupervisor(supervisorId: string, excludeClusterId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: supervisorId } });
    if (!user) throw new NotFoundException('Superviseur non trouvé');
    if (user.role !== Role.SUPERVISEUR) {
      throw new BadRequestException("L'utilisateur n'est pas un superviseur");
    }

    // Vérifier qu'il n'est pas déjà affecté à un autre cluster
    const otherCluster = await this.prisma.cluster.findFirst({
      where: {
        supervisorId,
        ...(excludeClusterId ? { id: { not: excludeClusterId } } : {}),
      },
    });
    if (otherCluster) {
      throw new BadRequestException(
        `Ce superviseur est déjà affecté au cluster "${otherCluster.name}"`,
      );
    }
  }
}
