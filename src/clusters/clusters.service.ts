import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { UpdateClusterDto } from './dto/update-cluster.dto';

@Injectable()
export class ClustersService {
  private readonly logger = new Logger(ClustersService.name);

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
        _count: { select: { members: { where: { role: 'COMMERCIAL', isActive: true } } } },
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
          _count: { select: { members: { where: { role: 'COMMERCIAL', isActive: true } } } },
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

  /**
   * Assigne ou remplace le superviseur d'un cluster.
   * Met automatiquement à jour TOUS les commerciaux du cluster pour qu'ils
   * pointent vers le nouveau superviseur.
   *
   * Cas couverts :
   *  - Cluster sans superviseur → on assigne pour la 1ère fois
   *  - Remplacement d'un superviseur existant → l'ancien est libéré, le nouveau prend
   *  - Le nouveau superviseur dirigeait déjà un autre cluster → refus (conflit)
   *
   * @throws BadRequestException si le user n'est pas un SUPERVISEUR
   * @throws ConflictException si le superviseur dirige déjà un autre cluster
   * @throws NotFoundException si le cluster ou le superviseur n'existe pas
   */
  async assignSupervisor(clusterId: string, newSupervisorId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Vérifier que le cluster existe
      const cluster = await tx.cluster.findUnique({
        where: { id: clusterId },
        select: { id: true, name: true, supervisorId: true },
      });
      if (!cluster) {
        throw new NotFoundException(`Cluster ${clusterId} introuvable`);
      }

      // 2. Vérifier que le nouveau superviseur existe et a le bon rôle
      const newSup = await tx.user.findUnique({
        where: { id: newSupervisorId },
        select: { id: true, fullName: true, role: true, clusterId: true },
      });
      if (!newSup) {
        throw new NotFoundException(`Utilisateur ${newSupervisorId} introuvable`);
      }
      if (newSup.role !== Role.SUPERVISEUR) {
        throw new BadRequestException(
          `L'utilisateur ${newSup.fullName} n'est pas un SUPERVISEUR (rôle actuel : ${newSup.role})`,
        );
      }

      // 3. Vérifier qu'il ne dirige pas déjà un AUTRE cluster
      const otherCluster = await tx.cluster.findFirst({
        where: { supervisorId: newSupervisorId, id: { not: clusterId } },
        select: { id: true, name: true },
      });
      if (otherCluster) {
        throw new ConflictException(
          `${newSup.fullName} dirige déjà ${otherCluster.name}. Libérez-le d'abord.`,
        );
      }

      // 4. Récupérer l'ancien superviseur s'il existe (pour le libérer après)
      const ancienSupervisorId = cluster.supervisorId;

      // 5. Mettre à jour le cluster avec le nouveau superviseur
      await tx.cluster.update({
        where: { id: clusterId },
        data: { supervisorId: newSupervisorId },
      });

      // 6. Mettre à jour le nouveau superviseur (lui attribuer le cluster)
      await tx.user.update({
        where: { id: newSupervisorId },
        data: { clusterId: clusterId },
      });

      // 7. Libérer l'ancien superviseur s'il existait et est différent du nouveau
      if (ancienSupervisorId && ancienSupervisorId !== newSupervisorId) {
        await tx.user.update({
          where: { id: ancienSupervisorId },
          data: { clusterId: null },
        });
      }

      // 8. CASCADE CRITIQUE : mettre à jour TOUS les commerciaux du cluster
      //    pour qu'ils pointent vers le nouveau superviseur
      const updateResult = await tx.user.updateMany({
        where: {
          clusterId: clusterId,
          role: Role.COMMERCIAL,
        },
        data: { supervisorId: newSupervisorId },
      });

      this.logger.log(
        `Cluster "${cluster.name}": superviseur ${newSup.id} assigné, ${updateResult.count} commerciaux mis à jour`,
      );

      return {
        clusterId,
        clusterName: cluster.name,
        newSupervisorId,
        newSupervisorName: newSup.fullName,
        ancienSupervisorId: ancienSupervisorId,
        commerciauxUpdated: updateResult.count,
      };
    });
  }

  /**
   * Retire le superviseur d'un cluster.
   * Refuse si le cluster contient des commerciaux actifs.
   * (Forcer l'admin à assigner un nouveau superviseur d'abord, plutôt
   * que de laisser des commerciaux orphelins.)
   */
  async removeSupervisor(clusterId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cluster = await tx.cluster.findUnique({
        where: { id: clusterId },
        select: { id: true, name: true, supervisorId: true },
      });
      if (!cluster) throw new NotFoundException(`Cluster ${clusterId} introuvable`);
      if (!cluster.supervisorId) {
        throw new BadRequestException(`Le cluster ${cluster.name} n'a pas de superviseur`);
      }

      // Vérifier qu'il n'y a pas de commerciaux actifs
      const nbCommerciaux = await tx.user.count({
        where: { clusterId, role: Role.COMMERCIAL, isActive: true },
      });
      if (nbCommerciaux > 0) {
        throw new ConflictException(
          `Impossible de retirer le superviseur : ${nbCommerciaux} commerciaux actifs dans ${cluster.name}. Assignez d'abord un nouveau superviseur.`,
        );
      }

      // Libérer le superviseur (clusterId à null)
      await tx.user.update({
        where: { id: cluster.supervisorId },
        data: { clusterId: null },
      });

      // Retirer du cluster
      await tx.cluster.update({
        where: { id: clusterId },
        data: { supervisorId: null },
      });

      this.logger.log(`Cluster "${cluster.name}": superviseur retiré`);

      return { clusterId, clusterName: cluster.name, message: 'Superviseur retiré avec succès' };
    });
  }
}
