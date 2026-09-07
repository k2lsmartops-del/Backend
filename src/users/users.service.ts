import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AgentStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { BulkImportRowDto } from './dto/bulk-import.dto';

/**
 * Champs retournés pour un utilisateur (sans le password).
 */
const USER_SELECT = {
  id: true,
  matricule: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  isActive: true,
  sponsorCode: true,
  objectifQuotidien: true,
  commune: true,
  habitation: true,
  clusterId: true,
  supervisorId: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  cluster: {
    select: {
      id: true,
      name: true,
      supervisor: { select: { id: true, fullName: true, matricule: true } },
    },
  },
  supervisor: { select: { id: true, fullName: true, matricule: true } },
};

/**
 * Filtre pour exclure les utilisateurs soft-deleted.
 * À utiliser dans toutes les requêtes de listing.
 */
const NOT_DELETED_FILTER = { deletedAt: null };

/**
 * Service de gestion des utilisateurs.
 * Seul l'ADMIN peut créer/modifier/désactiver des utilisateurs.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crée un utilisateur avec génération automatique du matricule.
   * Applique la hiérarchie automatiquement :
   * - COMMERCIAL assigné à un superviseur → hérite clusterId du superviseur
   * - COORDINATEUR = compte global, peut créer dans n'importe quel cluster
   * - Si créé par un SUPERVISEUR → ne peut créer que des COMMERCIAL dans son cluster
   */
  async create(
    dto: CreateUserDto,
    currentUser?: { id?: string; role: Role; clusterId?: string | null },
  ) {
    // SUPERVISEUR ne peut créer que des COMMERCIAL
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (dto.role !== Role.COMMERCIAL) {
        throw new ForbiddenException('Un superviseur ne peut créer que des commerciaux');
      }
      // Force le supervisorId à être le superviseur courant
      dto.supervisorId = currentUser.id;
    }

    // Vérifie les doublons (phone et email)
    await this.checkDuplicates(dto.phone, dto.email);

    // Le COORDINATEUR est un compte global — il peut créer dans n'importe quel cluster
    let effectiveClusterId = dto.clusterId;

    // Valide les rattachements selon le rôle
    await this.validateRoleAssignments(dto.role, effectiveClusterId, dto.supervisorId);

    // Applique la hiérarchie automatiquement
    const clusterId = await this.resolveHierarchy(
      dto.role,
      dto.supervisorId,
      effectiveClusterId,
    );

    // Génère le matricule automatiquement
    const matricule = await this.generateMatricule(dto.role);

    // Génère le code de parrainage pour les commerciaux (si non fourni)
    let sponsorCode: string | undefined;
    if (dto.role === Role.COMMERCIAL) {
      sponsorCode = dto.sponsorCode && dto.sponsorCode.trim()
        ? dto.sponsorCode.trim().toUpperCase()
        : await this.generateSponsorCode();
    }

    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Détermine isActive depuis le statut
    const status = dto.status || AgentStatus.ACTIF;
    const isActive = status === AgentStatus.ACTIF;

    return this.prisma.user.create({
      data: {
        matricule,
        fullName: dto.fullName,
        email: dto.email || null,
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role,
        status,
        isActive,
        sponsorCode,
        clusterId,
        supervisorId: dto.supervisorId || null,
      },
      select: USER_SELECT,
    });
  }

  /**
   * Liste paginée des utilisateurs avec filtres.
   */
  async findAll(
    query: QueryUsersDto,
    currentUser?: { id?: string; role: Role; clusterId?: string | null },
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      isActive,
      clusterId,
      supervisorId,
    } = query;
    const skip = (page - 1) * limit;

    // Construction du filtre WHERE - exclure les utilisateurs soft-deleted
    const where: Record<string, unknown> = { ...NOT_DELETED_FILTER };

    // Filtrage automatique selon le rôle du demandeur
    if (currentUser) {
      switch (currentUser.role) {
        case Role.COORDINATEUR:
          // Ne voit que superviseurs et commerciaux
          where.role = { in: [Role.SUPERVISEUR, Role.COMMERCIAL] };
          break;
        case Role.SUPERVISEUR:
          // Ne voit que ses commerciaux
          where.supervisorId = currentUser.id;
          where.role = Role.COMMERCIAL;
          break;
        case Role.ADMIN:
          // ADMIN voit tout sauf les autres admins
          where.role = { not: Role.ADMIN };
          break;
      }
    }

    // Filtres additionnels depuis la query
    if (role) where.role = role;
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (clusterId && !where.clusterId) where.clusterId = clusterId;
    if (supervisorId) where.supervisorId = supervisorId;

    // Recherche textuelle sur plusieurs champs
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { matricule: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Détail d'un utilisateur par ID.
   * SUPERVISEUR ne peut voir que ses commerciaux.
   */
  async findOne(
    id: string,
    currentUser?: { id?: string; role: Role; clusterId?: string | null },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        // Inclut les commerciaux rattachés si c'est un superviseur
        commercials: {
          select: { id: true, fullName: true, matricule: true, isActive: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // SUPERVISEUR ne peut voir que ses commerciaux (directement rattachés ou du cluster)
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (user.supervisorId !== currentUser.id && user.clusterId !== currentUser.clusterId) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
    }

    return user;
  }

  /**
   * Met à jour un utilisateur.
   * SUPERVISEUR ne peut modifier que ses commerciaux.
   */
  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser?: { id?: string; role: Role },
  ) {
    // Vérifie que l'utilisateur existe
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // SUPERVISEUR ne peut modifier que ses propres commerciaux
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (existing.supervisorId !== currentUser.id) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
      // SUPERVISEUR ne peut pas changer le rôle ou le superviseur
      if (dto.role && dto.role !== Role.COMMERCIAL) {
        throw new ForbiddenException('Un superviseur ne peut pas changer le rôle');
      }
      if (dto.supervisorId !== undefined && dto.supervisorId !== currentUser.id) {
        throw new ForbiddenException('Un superviseur ne peut pas réaffecter un commercial');
      }
    }

    // Vérifie les doublons si phone ou email changent
    if (dto.phone || dto.email) {
      await this.checkDuplicates(
        dto.phone || existing.phone,
        dto.email !== undefined ? dto.email : existing.email,
        id,
      );
    }

    // Valide les rattachements si le rôle ou le superviseur changent
    const newRole = dto.role || existing.role;
    const newSupervisorId =
      dto.supervisorId !== undefined ? dto.supervisorId : existing.supervisorId;

    if (dto.role || dto.supervisorId !== undefined) {
      await this.validateRoleAssignments(newRole, null, newSupervisorId);
    }

    // Prépare les données à mettre à jour
    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.supervisorId !== undefined) data.supervisorId = dto.supervisorId;

    // Applique la hiérarchie automatiquement
    // - Pour COMMERCIAL : hérite toujours du superviseur si assigné
    if (newRole === Role.COMMERCIAL && newSupervisorId) {
      const clusterId = await this.resolveHierarchy(
        newRole,
        newSupervisorId,
        existing.clusterId,
      );
      data.clusterId = clusterId;
    }

    // Gestion du statut agent (4 états)
    const isDeactivating =
      (dto.status !== undefined && dto.status !== AgentStatus.ACTIF) ||
      (dto.isActive === false);

    // GARDE-FOU CAS 4a : Refuser désactivation SUPERVISEUR si commerciaux actifs
    if (isDeactivating && existing.role === Role.SUPERVISEUR) {
      const activeCommerciaux = await this.prisma.user.count({
        where: {
          supervisorId: id,
          role: Role.COMMERCIAL,
          isActive: true,
        },
      });
      if (activeCommerciaux > 0) {
        throw new BadRequestException(
          `Ce superviseur a ${activeCommerciaux} commercial(aux) actif(s). ` +
            `Réaffectez-les d'abord.`,
        );
      }
    }

    // GARDE-FOU CAS 4b : Refuser désactivation SUPERVISEUR si pilote un cluster
    if (isDeactivating && existing.role === Role.SUPERVISEUR) {
      const managedCluster = await this.prisma.cluster.findFirst({
        where: { supervisorId: id },
        select: { name: true },
      });
      if (managedCluster) {
        throw new BadRequestException(
          `Ce superviseur pilote le cluster "${managedCluster.name}". ` +
            `Retirez-le du cluster d'abord.`,
        );
      }
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
      data.isActive = dto.status === AgentStatus.ACTIF;
    } else if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      data.status = dto.isActive ? AgentStatus.ACTIF : AgentStatus.DESACTIVE;
    }

    // Hash le nouveau mot de passe si fourni
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 12);
    }

    // Gestion du sponsorCode avec vérification d'unicité
    if (dto.sponsorCode !== undefined) {
      if (dto.sponsorCode === null || dto.sponsorCode === '') {
        data.sponsorCode = null;
      } else {
        // Vérifier l'unicité du sponsorCode
        const existingWithCode = await this.prisma.user.findFirst({
          where: {
            sponsorCode: dto.sponsorCode,
            id: { not: id },
          },
        });
        if (existingWithCode) {
          throw new ConflictException(
            `Le code parrainage "${dto.sponsorCode}" est déjà utilisé par un autre utilisateur`,
          );
        }
        data.sponsorCode = dto.sponsorCode;
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  /**
   * Met à jour le code parrainage d'un commercial.
   * Un SUPERVISEUR peut modifier le sponsorCode de tout commercial
   * appartenant à son cluster (même s'il n'est pas son superviseur direct).
   */
  async updateSponsorCode(
    id: string,
    sponsorCode: string | null,
    currentUser?: { id?: string; role: Role; clusterId?: string | null },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que c'est un COMMERCIAL
    if (existing.role !== Role.COMMERCIAL) {
      throw new BadRequestException('Le code parrainage ne concerne que les commerciaux');
    }

    // SUPERVISEUR : accès autorisé si le commercial est dans son cluster
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (existing.clusterId !== currentUser.clusterId) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
    }

    const data: Record<string, unknown> = {};

    // Gestion du sponsorCode avec vérification d'unicité
    if (sponsorCode === null || sponsorCode === '') {
      data.sponsorCode = null;
    } else {
      const existingWithCode = await this.prisma.user.findFirst({
        where: {
          sponsorCode,
          id: { not: id },
        },
      });
      if (existingWithCode) {
        throw new ConflictException(
          `Le code parrainage "${sponsorCode}" est déjà utilisé par un autre utilisateur`,
        );
      }
      data.sponsorCode = sponsorCode;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  /**
   * Désactive un utilisateur (soft delete).
   * SUPERVISEUR ne peut désactiver que ses commerciaux.
   */
  async deactivate(id: string, currentUser?: { id?: string; role: Role }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // SUPERVISEUR ne peut désactiver que ses propres commerciaux
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (user.supervisorId !== currentUser.id) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false, status: AgentStatus.DESACTIVE },
      select: USER_SELECT,
    });
  }

  /**
   * Réactive un utilisateur.
   * SUPERVISEUR ne peut réactiver que ses commerciaux.
   */
  async activate(id: string, currentUser?: { id?: string; role: Role }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // SUPERVISEUR ne peut réactiver que ses propres commerciaux
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (user.supervisorId !== currentUser.id) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true, status: AgentStatus.ACTIF },
      select: USER_SELECT,
    });
  }

  /**
   * Suspend un utilisateur (blocage temporaire).
   * Le compte n'est plus utilisable mais peut être réactivé.
   * @deprecated Utiliser softDelete à la place
   */
  async suspend(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false, status: AgentStatus.SUSPENDU },
      select: USER_SELECT,
    });
  }

  /**
   * Supprime un utilisateur (soft-delete).
   * Le compte est marqué comme supprimé mais les données sont conservées en BDD.
   * 
   * Permissions :
   * - ADMIN : peut supprimer tout utilisateur (sauf ADMIN)
   * - COORDINATEUR : peut supprimer superviseurs et commerciaux
   * - SUPERVISEUR : peut supprimer uniquement ses commerciaux
   */
  async softDelete(id: string, currentUser?: { id?: string; role: Role }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérification des permissions
    if (currentUser) {
      switch (currentUser.role) {
        case Role.SUPERVISEUR:
          // SUPERVISEUR ne peut supprimer que ses propres commerciaux
          if (user.supervisorId !== currentUser.id) {
            throw new ForbiddenException('Vous ne pouvez supprimer que les commerciaux de votre équipe');
          }
          if (user.role !== Role.COMMERCIAL) {
            throw new ForbiddenException('Un superviseur ne peut supprimer que des commerciaux');
          }
          break;
        case Role.COORDINATEUR:
          // COORDINATEUR peut supprimer superviseurs et commerciaux
          if (user.role !== Role.SUPERVISEUR && user.role !== Role.COMMERCIAL) {
            throw new ForbiddenException('Vous ne pouvez supprimer que des superviseurs ou commerciaux');
          }
          break;
        case Role.ADMIN:
          // ADMIN ne peut pas supprimer d'autres ADMIN
          if (user.role === Role.ADMIN) {
            throw new ForbiddenException('Impossible de supprimer un compte administrateur');
          }
          break;
        default:
          throw new ForbiddenException('Action non autorisée');
      }
    }

    // GARDE-FOU : Refuser suppression SUPERVISEUR si commerciaux actifs
    if (user.role === Role.SUPERVISEUR) {
      const activeCommerciaux = await this.prisma.user.count({
        where: {
          supervisorId: id,
          role: Role.COMMERCIAL,
          isActive: true,
          deletedAt: null,
        },
      });
      if (activeCommerciaux > 0) {
        throw new BadRequestException(
          `Ce superviseur a ${activeCommerciaux} commercial(aux) actif(s). Réaffectez-les d'abord.`,
        );
      }
    }

    // GARDE-FOU : Refuser suppression SUPERVISEUR si pilote un cluster
    if (user.role === Role.SUPERVISEUR) {
      const managedCluster = await this.prisma.cluster.findFirst({
        where: { supervisorId: id },
        select: { name: true },
      });
      if (managedCluster) {
        throw new BadRequestException(
          `Ce superviseur pilote le cluster "${managedCluster.name}". Retirez-le du cluster d'abord.`,
        );
      }
    }

    // Soft-delete : marquer deletedAt et désactiver le compte
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: AgentStatus.DESACTIVE,
      },
      select: USER_SELECT,
    });
  }

  /**
   * Régénère un mot de passe aléatoire pour un utilisateur.
   * SUPERVISEUR ne peut réinitialiser que le mot de passe de ses commerciaux.
   */
  async resetPassword(id: string, currentUser?: { id?: string; role: Role }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // SUPERVISEUR ne peut réinitialiser que le mot de passe de ses propres commerciaux
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (user.supervisorId !== currentUser.id) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
    }

    const newPassword = Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });

    return {
      message: 'Mot de passe réinitialisé',
      temporaryPassword: newPassword,
    };
  }

  /**
   * Retire un commercial de l'équipe du superviseur.
   * Met supervisorId à null.
   */
  async removeFromTeam(id: string, currentUser?: { id?: string; role: Role }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que c'est bien un commercial
    if (user.role !== Role.COMMERCIAL) {
      throw new BadRequestException('Seuls les commerciaux peuvent être retirés d\'une équipe');
    }

    // SUPERVISEUR ne peut retirer que ses propres commerciaux
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (user.supervisorId !== currentUser.id) {
        throw new ForbiddenException('Accès non autorisé à cet utilisateur');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { supervisorId: null, clusterId: null },
      select: USER_SELECT,
    });
  }

  /**
   * Import en masse d'une équipe complète depuis un fichier Excel.
   * Nouvelle logique simplifiée :
   *   1. COORDINATEUR → pas de rattachement territorial (voit tout pour valider)
   *   2. SUPERVISEUR  → lié à un cluster
   *   3. COMMERCIAL   → lié à un cluster (comme le superviseur)
   *
   * Chaque ligne est traitée indépendamment : une erreur sur une ligne
   * n'empêche pas le traitement des autres. Retourne un rapport détaillé.
   */
  async bulkImport(rows: BulkImportRowDto[]) {
    this.logger.log(`Import: début de l'import de ${rows.length} ligne(s)`);
    const norm = (v?: string | null) => (v ?? '').toString().trim();
    const rolePriority: Record<string, number> = {
      COORDINATEUR: 1,
      SUPERVISEUR: 2,
      COMMERCIAL: 3,
    };

    type RowResult = {
      row: number;
      status: 'created' | 'updated' | 'error';
      role?: string;
      fullName?: string;
      matricule?: string;
      message?: string;
    };
    const results: RowResult[] = [];

    // Conserve le numéro de ligne d'origine (en-tête = ligne 1)
    const indexed = rows.map((r, idx) => ({ r, rowNum: idx + 2 }));

    // Tri par priorité de rôle pour garantir l'ordre de création
    indexed.sort(
      (a, b) =>
        (rolePriority[norm(a.r.role).toUpperCase()] || 99) -
        (rolePriority[norm(b.r.role).toUpperCase()] || 99),
    );

    for (const { r, rowNum } of indexed) {
      const role = norm(r.role).toUpperCase();
      const fullName = norm(r.fullName);
      const phone = norm(r.phone);
      const email = norm(r.email) || null;
      const sponsorCode = norm(r.sponsorCode) || null;
      const commune = norm(r.commune) || null;
      const habitation = norm(r.habitation) || null;

      try {
        if (!fullName) throw new BadRequestException('Nom complet requis');
        if (!phone) throw new BadRequestException('Téléphone requis');

        // Mot de passe : fourni ou généré par défaut
        const rawPassword = norm(r.password) || this.generateDefaultPassword();

        // Vérifie si l'utilisateur existe déjà (par téléphone)
        const existingUser = await this.prisma.user.findUnique({
          where: { phone },
        });

        if (rawPassword.length < 8) {
          throw new BadRequestException(
            'Le mot de passe doit contenir au moins 8 caractères',
          );
        }

        // Vérifie email unique si fourni
        if (email) {
          const existingEmail = await this.prisma.user.findUnique({
            where: { email },
          });
          if (existingEmail && existingEmail.id !== existingUser?.id) {
            throw new ConflictException(
              `Email ${email} déjà utilisé par ${existingEmail.matricule}`,
            );
          }
        }

        // Vérifie l'unicité du sponsorCode s'il est fourni
        if (sponsorCode) {
          const existingSponsorCode = await this.prisma.user.findFirst({
            where: { sponsorCode },
          });
          if (existingSponsorCode && existingSponsorCode.id !== existingUser?.id) {
            throw new ConflictException(
              `Code de parrainage "${sponsorCode}" déjà utilisé par ${existingSponsorCode.matricule}`,
            );
          }
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        if (role === 'COORDINATEUR') {
          let user: any;
          let matricule: string;
          let status: 'created' | 'updated';

          if (existingUser) {
            matricule = existingUser.matricule;
            user = await this.prisma.user.update({
              where: { id: existingUser.id },
              data: {
                fullName,
                email,
                password: hashedPassword,
                role: Role.COORDINATEUR,
                status: AgentStatus.ACTIF,
                isActive: true,
                clusterId: null, // COORDINATEUR sans rattachement territorial
                sponsorCode,
                commune,
                habitation,
              },
            });
            status = 'updated';
          } else {
            matricule = await this.generateMatricule(Role.COORDINATEUR);
            user = await this.prisma.user.create({
              data: {
                matricule,
                fullName,
                email,
                phone,
                password: hashedPassword,
                role: Role.COORDINATEUR,
                status: AgentStatus.ACTIF,
                isActive: true,
                clusterId: null, // COORDINATEUR sans rattachement territorial
                sponsorCode,
                commune,
                habitation,
              },
            });
            status = 'created';
          }

          results.push({
            row: rowNum,
            status,
            role,
            fullName,
            matricule,
          });
          this.logger.log(
            `Import ligne ${rowNum}: COORDINATEUR ${status === 'created' ? 'créé' : 'mis à jour'} (${matricule})`,
          );
        } else if (role === 'SUPERVISEUR' || role === 'COMMERCIAL') {
          // Rétrocompatibilité : accepte cluster OU zone (ancien nom)
          const clusterName = norm(r.cluster) || norm(r.zone);
          if (!clusterName) {
            throw new BadRequestException(
              'Cluster requis pour un superviseur ou un commercial',
            );
          }

          // Créer ou trouver le cluster
          let cluster = await this.prisma.cluster.findUnique({
            where: { name: clusterName },
          });
          if (!cluster) {
            cluster = await this.prisma.cluster.create({
              data: { name: clusterName },
            });
          }

          let matricule: string;
          let status: 'created' | 'updated';
          let userId: string;
          const userRole = role === 'SUPERVISEUR' ? Role.SUPERVISEUR : Role.COMMERCIAL;

          if (existingUser) {
            matricule = existingUser.matricule;
            userId = existingUser.id;
            await this.prisma.user.update({
              where: { id: existingUser.id },
              data: {
                fullName,
                email,
                password: hashedPassword,
                role: userRole,
                status: AgentStatus.ACTIF,
                isActive: true,
                clusterId: cluster.id,
                sponsorCode,
                commune,
                habitation,
              },
            });
            status = 'updated';
          } else {
            matricule = await this.generateMatricule(userRole);
            const newUser = await this.prisma.user.create({
              data: {
                matricule,
                fullName,
                email,
                phone,
                password: hashedPassword,
                role: userRole,
                status: AgentStatus.ACTIF,
                isActive: true,
                clusterId: cluster.id,
                sponsorCode,
                commune,
                habitation,
              },
            });
            userId = newUser.id;
            status = 'created';
          }

          // Si c'est un superviseur, le rattacher comme superviseur du cluster
          if (role === 'SUPERVISEUR') {
            // Vérifier si le cluster a déjà un superviseur
            if (cluster.supervisorId && cluster.supervisorId !== userId) {
              this.logger.warn(
                `Import ligne ${rowNum}: le cluster "${clusterName}" a déjà un superviseur — remplacement par ${matricule}.`,
              );
            }
            await this.prisma.cluster.update({
              where: { id: cluster.id },
              data: { supervisorId: userId },
            });
          }

          results.push({
            row: rowNum,
            status,
            role,
            fullName,
            matricule,
          });
          this.logger.log(
            `Import ligne ${rowNum}: ${role} ${status === 'created' ? 'créé' : 'mis à jour'} (${matricule}) — cluster=${clusterName}`,
          );
        } else {
          throw new BadRequestException(
            `Rôle invalide: "${r.role}" (attendu: COORDINATEUR, SUPERVISEUR ou COMMERCIAL)`,
          );
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Erreur inconnue';
        // Trace l'échec ligne par ligne : sans ça, une ligne rejetée
        // disparaît silencieusement du rapport agrégé côté serveur.
        this.logger.warn(
          `Import ligne ${rowNum} échouée (role=${role || '-'}): ${message}`,
        );
        results.push({
          row: rowNum,
          status: 'error',
          role,
          fullName,
          message,
        });
      }
    }

    // Rétablit l'ordre d'origine pour le rapport
    results.sort((a, b) => a.row - b.row);

    const created = results.filter((r) => r.status === 'created').length;
    const updated = results.filter((r) => r.status === 'updated').length;
    const failed = results.filter((r) => r.status === 'error').length;

    this.logger.log(
      `Import terminé: ${created} créé(s), ${updated} mis à jour, ${failed} échec(s) sur ${results.length} ligne(s)`,
    );

    // ── PROPAGATION AUTOMATIQUE des supervisorId ────────────────────────────
    // Après l'import, on parcourt tous les clusters qui ont un superviseur assigné
    // et on met à jour le supervisorId de tous les commerciaux de ce cluster.
    // Sans ça, les commerciaux ont clusterId rempli mais supervisorId=null.
    this.logger.log('Propagation des supervisorId sur les commerciaux...');

    const clustersWithSupervisor = await this.prisma.cluster.findMany({
      where: { supervisorId: { not: null } },
      select: { id: true, name: true, supervisorId: true },
    });

    let commerciauxUpdated = 0;
    for (const cluster of clustersWithSupervisor) {
      const updateResult = await this.prisma.user.updateMany({
        where: {
          clusterId: cluster.id,
          role: Role.COMMERCIAL,
          supervisorId: { not: cluster.supervisorId }, // uniquement ceux qui ne sont pas déjà rattachés
        },
        data: { supervisorId: cluster.supervisorId },
      });
      if (updateResult.count > 0) {
        this.logger.log(
          `Cluster "${cluster.name}": ${updateResult.count} commerciaux rattachés au superviseur`,
        );
        commerciauxUpdated += updateResult.count;
      }
    }

    this.logger.log(`Propagation terminée: ${commerciauxUpdated} commerciaux mis à jour au total`);

    return {
      total: results.length,
      created,
      updated,
      failed,
      commerciauxUpdated,
      results,
    };
  }

  /**
   * Génère un mot de passe par défaut aléatoire (8+ caractères).
   */
  private generateDefaultPassword(): string {
    return `K2l${Math.random().toString(36).slice(2, 8)}!`;
  }

  /**
   * Récupère l'équipe d'un superviseur (commerciaux du cluster).
   * Inclut des statistiques de soumissions pour chaque membre.
   */
  async getTeam(supervisorId: string, clusterId?: string | null) {
    const members = await this.prisma.user.findMany({
      where: {
        ...(clusterId ? { clusterId } : { supervisorId }),
        role: Role.COMMERCIAL,
      },
      select: {
        ...USER_SELECT,
        _count: {
          select: { submissions: true },
        },
        submissions: {
          select: { status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { fullName: 'asc' },
    });

    if (members.length === 0) return [];

    // ── Évite le N+1 ──
    // Au lieu d'un COUNT par commercial (N requêtes), on agrège le nombre de
    // soumissions validées de TOUTE l'équipe en UNE seule requête groupBy,
    // puis on associe chaque résultat à son commercial via une Map O(1).
    const memberIds = members.map((m) => m.id);
    const validatedCounts = await this.prisma.submission.groupBy({
      by: ['commercialId'],
      where: {
        commercialId: { in: memberIds },
        status: 'VALIDATED',
      },
      _count: { id: true },
    });
    const validatedMap = new Map(
      validatedCounts.map((v) => [v.commercialId, v._count.id]),
    );

    return members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      matricule: m.matricule,
      phone: m.phone,
      status: m.status,
      submissionCount: m._count.submissions,
      validatedCount: validatedMap.get(m.id) ?? 0,
      lastActivity: m.submissions[0]?.createdAt || null,
    }));
  }

  // ──────────────────────────────────────────────
  //  Méthodes utilitaires privées
  // ──────────────────────────────────────────────

  /**
   * Vérifie qu'aucun autre utilisateur n'a le même phone ou email.
   * @param excludeId ID à exclure de la vérification (pour les mises à jour)
   */
  private async checkDuplicates(
    phone: string,
    email?: string | null,
    excludeId?: string,
  ) {
    const conditions: Record<string, string>[] = [{ phone }];
    if (email) conditions.push({ email });

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: conditions,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      if (existing.phone === phone) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
      }
      if (email && existing.email === email) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }
  }

  /**
   * Valide les règles de rattachement selon le rôle :
   *  - COMMERCIAL : supervisorId obligatoire
   *  - SUPERVISEUR, COORDINATEUR, ADMIN, CLIENT : aucun rattachement obligatoire
   */
  private async validateRoleAssignments(
    role: Role,
    clusterId?: string | null,
    supervisorId?: string | null,
  ) {
    // Vérifie que le cluster existe si fourni
    if (clusterId) {
      const cluster = await this.prisma.cluster.findUnique({ where: { id: clusterId } });
      if (!cluster) {
        throw new NotFoundException('Cluster non trouvé');
      }
    }

    // COMMERCIAL : doit avoir un superviseur
    if (role === Role.COMMERCIAL) {
      if (!supervisorId) {
        throw new BadRequestException(
          'Un commercial doit être rattaché à un superviseur',
        );
      }
      // Vérifie que le superviseur existe et est bien superviseur
      const supervisor = await this.prisma.user.findUnique({
        where: { id: supervisorId },
      });
      if (!supervisor) {
        throw new NotFoundException('Superviseur non trouvé');
      }
      if (supervisor.role !== Role.SUPERVISEUR) {
        throw new BadRequestException(
          "L'utilisateur désigné n'est pas un superviseur",
        );
      }
    }
  }

  /**
   * Résout la hiérarchie automatiquement :
   * - COMMERCIAL assigné à un superviseur → hérite clusterId du superviseur
   * - SUPERVISEUR → garde son clusterId tel quel
   * - COORDINATEUR → pas de clusterId (compte global)
   */
  private async resolveHierarchy(
    role: Role,
    supervisorId?: string | null,
    clusterId?: string | null,
  ): Promise<string | null> {
    // COMMERCIAL : hérite du superviseur
    if (role === Role.COMMERCIAL && supervisorId) {
      const supervisor = await this.prisma.user.findUnique({
        where: { id: supervisorId },
        select: { clusterId: true },
      });
      if (supervisor) {
        return supervisor.clusterId;
      }
    }

    // Sinon, utilise la valeur fournie
    return clusterId || null;
  }

  /**
   * Génère un matricule unique selon le rôle.
   * Format : ADM-001, COORD-001, SUP-001, AGT-001, CLI-001
   */
  private async generateMatricule(role: Role): Promise<string> {
    const prefixMap: Record<Role, string> = {
      [Role.ADMIN]: 'ADM',
      [Role.COORDINATEUR]: 'COORD',
      [Role.SUPERVISEUR]: 'SUP',
      [Role.COMMERCIAL]: 'AGT',
      [Role.CLIENT]: 'CLI',
    };

    const prefix = prefixMap[role];

    // Compte le nombre d'utilisateurs existants avec ce rôle
    const count = await this.prisma.user.count({ where: { role } });
    const number = (count + 1).toString().padStart(3, '0');

    const matricule = `${prefix}-${number}`;

    // Vérifie l'unicité (en cas de suppression/réassignation)
    const exists = await this.prisma.user.findUnique({ where: { matricule } });
    if (exists) {
      // Fallback : incrémente jusqu'à trouver un matricule libre
      let i = count + 2;
      let candidate = `${prefix}-${i.toString().padStart(3, '0')}`;
      while (
        await this.prisma.user.findUnique({ where: { matricule: candidate } })
      ) {
        i++;
        candidate = `${prefix}-${i.toString().padStart(3, '0')}`;
      }
      return candidate;
    }

    return matricule;
  }

  /**
   * Génère un code de parrainage unique pour un commercial.
   * Format: 8 caractères alphanumériques en majuscules
   */
  private async generateSponsorCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = '';
      for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      const exists = await this.prisma.user.findFirst({ where: { sponsorCode: code } });
      if (!exists) {
        isUnique = true;
      }
    }

    return code!;
  }

  /**
   * Récupère les statistiques d'un utilisateur.
   * SUPERVISEUR peut voir uniquement ses commerciaux.
   */
  async getStats(userId: string, currentUser: any) {
    // Vérifier les permissions
    if (currentUser.role === Role.SUPERVISEUR) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { supervisorId: true, clusterId: true },
      });
      if (!user || (user.supervisorId !== currentUser.id && user.clusterId !== currentUser.clusterId)) {
        throw new ForbiddenException('Vous ne pouvez voir que les statistiques de vos commerciaux');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cluster: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalSubmissions, validatedSubmissions, rejectedSubmissions, todaySubmissions, weekSubmissions] = await Promise.all([
      this.prisma.submission.count({
        where: { commercialId: userId },
      }),
      this.prisma.submission.count({
        where: { commercialId: userId, status: 'VALIDATED' },
      }),
      this.prisma.submission.count({
        where: { commercialId: userId, status: 'REJECTED' },
      }),
      this.prisma.submission.count({
        where: { commercialId: userId, createdAt: { gte: startOfToday } },
      }),
      this.prisma.submission.count({
        where: { commercialId: userId, createdAt: { gte: startOfWeek } },
      }),
    ]);

    const validationRate = totalSubmissions > 0
      ? Math.round((validatedSubmissions / totalSubmissions) * 100)
      : 0;

    return {
      totalSubmissions,
      validatedSubmissions,
      rejectedSubmissions,
      todaySubmissions,
      weekSubmissions,
      validationRate,
    };
  }

  /**
   * Récupère les informations de paiement d'un utilisateur.
   * SUPERVISEUR peut voir uniquement ses commerciaux.
   * Affiche les statistiques par type d'installation pour le calcul manuel.
   */
  async getPayment(userId: string, currentUser: any) {
    // Vérifier les permissions
    if (currentUser.role === Role.SUPERVISEUR) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { supervisorId: true, clusterId: true },
      });
      if (!user || (user.supervisorId !== currentUser.id && user.clusterId !== currentUser.clusterId)) {
        throw new ForbiddenException('Vous ne pouvez voir que les paiements de vos commerciaux');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Compter les soumissions validées par type d'installation
    const [totalValidated, installedCount, installedActivatedCount] = await Promise.all([
      this.prisma.submission.count({
        where: { commercialId: userId, status: 'VALIDATED' },
      }),
      this.prisma.submission.count({
        where: { commercialId: userId, status: 'VALIDATED', appStatus: 'INSTALLED' },
      }),
      this.prisma.submission.count({
        where: { commercialId: userId, status: 'VALIDATED', appStatus: 'INSTALLED_TRANSACTIONS' },
      }),
    ]);

    return {
      totalValidated,
      installedCount,
      installedTransactionsCount: installedActivatedCount,
      note: 'Les prix par type d\'installation sont à définir. Le calcul du paiement se fait manuellement.',
    };
  }

  /**
   * Permet à un utilisateur de changer son propre mot de passe.
   * Accessible à tous les utilisateurs authentifiés.
   */
  async changePassword(userId: string, newPassword: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Valider le nouveau mot de passe
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  /**
   * Permet à un utilisateur de modifier ses propres informations personnelles.
   * Uniquement fullName, gender, phone et email peuvent être modifiés.
   */
  async updateProfile(userId: string, data: { fullName?: string; gender?: string; phone?: string; email?: string }) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Valider les données
    const updateData: any = {};

    if (data.fullName !== undefined) {
      if (!data.fullName || data.fullName.trim().length === 0) {
        throw new BadRequestException('Le nom complet est requis');
      }
      updateData.fullName = data.fullName.trim();
    }

    if (data.gender !== undefined) {
      if (data.gender && !['M', 'F'].includes(data.gender)) {
        throw new BadRequestException('Le genre doit être "M" (Masculin) ou "F" (Féminin)');
      }
      updateData.gender = data.gender || null;
    }

    if (data.phone !== undefined) {
      if (!data.phone || data.phone.trim().length === 0) {
        throw new BadRequestException('Le numéro de téléphone est requis');
      }
      // Vérifier que le numéro n'est pas déjà utilisé par un autre utilisateur
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: data.phone, id: { not: userId } },
      });
      if (existingPhone) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
      }
      updateData.phone = data.phone.trim();
    }

    if (data.email !== undefined) {
      if (data.email && data.email.trim().length > 0) {
        // Vérifier le format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new BadRequestException('Format d\'email invalide');
        }
        // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
        const existingEmail = await this.prisma.user.findFirst({
          where: { email: data.email, id: { not: userId } },
        });
        if (existingEmail) {
          throw new ConflictException('Cet email est déjà utilisé');
        }
        updateData.email = data.email.trim();
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_SELECT,
    });

    this.logger.log(`Utilisateur ${userId} a mis à jour son profil`);

    return updatedUser;
  }

  /**
   * Activer l'authentification à double facteur.
   * Génère un secret et retourne un QR code pour configurer l'application d'authentification.
   */
  async enableTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('L\'authentification à double facteur est déjà activée');
    }

    // Générer un secret
    const secret = speakeasy.generateSecret({
      name: `K2L SmartOps (${user.fullName})`,
      issuer: 'K2L SmartOps',
    });

    // Sauvegarder le secret (pas encore activé)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Générer le QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    this.logger.log(`Utilisateur ${userId} a initié l'activation du 2FA`);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scannez le QR code avec votre application d\'authentification et entrez le code pour activer',
    };
  }

  /**
   * Vérifier le code 2FA et activer définitivement.
   */
  async verifyAndActivateTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Aucun secret 2FA trouvé. Veuillez d\'abord activer le 2FA');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('L\'authentification à double facteur est déjà activée');
    }

    // Vérifier le token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Code invalide');
    }

    // Activer le 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    this.logger.log(`Utilisateur ${userId} a activé le 2FA`);

    return { message: 'Authentification à double facteur activée avec succès' };
  }

  /**
   * Désactiver l'authentification à double facteur.
   */
  async disableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('L\'authentification à double facteur n\'est pas activée');
    }

    // Vérifier le token avant de désactiver
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Code invalide');
    }

    // Désactiver le 2FA et supprimer le secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    this.logger.log(`Utilisateur ${userId} a désactivé le 2FA`);

    return { message: 'Authentification à double facteur désactivée avec succès' };
  }

  /**
   * Vérifier un code 2FA (utilisé lors du login).
   */
  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: token,
      window: 2,
    });
  }

  /**
   * Récupère les KPI du jour pour l'utilisateur connecté.
   * Retourne le nombre de soumissions du jour par type et l'objectif quotidien.
   */
  async getTodayKpi(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { objectifQuotidien: true },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Début et fin de la journée courante (timezone UTC)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Compter les soumissions du jour par type
    const [prospects, marchands, valides] = await Promise.all([
      this.prisma.submission.count({
        where: {
          commercialId: userId,
          type: 'PROSPECT',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.submission.count({
        where: {
          commercialId: userId,
          type: 'MARCHAND',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.submission.count({
        where: {
          commercialId: userId,
          status: 'VALIDATED',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    return {
      prospects,
      marchands,
      valides,
      objectif: user.objectifQuotidien || 20,
      total: prospects + marchands,
      progress: Math.min(((prospects + marchands) / (user.objectifQuotidien || 20)) * 100, 100),
    };
  }
}
