import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

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
  zoneId: true,
  secteurId: true,
  supervisorId: true,
  createdAt: true,
  updatedAt: true,
  zone: {
    select: {
      id: true,
      name: true,
      coordinator: { select: { id: true, fullName: true, matricule: true } },
    },
  },
  secteur: { select: { id: true, name: true } },
  supervisor: { select: { id: true, fullName: true, matricule: true } },
};

/**
 * Service de gestion des utilisateurs.
 * Seul l'ADMIN peut créer/modifier/désactiver des utilisateurs.
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée un utilisateur avec génération automatique du matricule.
   * Applique la hiérarchie automatiquement :
   * - COMMERCIAL assigné à un superviseur → hérite secteurId et zoneId du superviseur
   * - SUPERVISEUR assigné à un secteur → hérite zoneId du secteur
   * - Si créé par un COORDINATEUR → hérite automatiquement de sa zoneId
   * - Si créé par un SUPERVISEUR → ne peut créer que des COMMERCIAL dans son secteur
   */
  async create(
    dto: CreateUserDto,
    currentUser?: { id?: string; role: Role; zoneId?: string | null; secteurId?: string | null },
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

    // Si créé par un COORDINATEUR, forcer la zoneId du coordinateur
    let effectiveZoneId = dto.zoneId;
    if (currentUser?.role === Role.COORDINATEUR && currentUser.zoneId) {
      effectiveZoneId = currentUser.zoneId;
    }

    // Valide les rattachements selon le rôle
    await this.validateRoleAssignments(dto.role, effectiveZoneId, dto.supervisorId);

    // Applique la hiérarchie automatiquement
    const { zoneId, secteurId } = await this.resolveHierarchy(
      dto.role,
      dto.supervisorId,
      dto.secteurId,
      effectiveZoneId,
    );

    // Génère le matricule automatiquement
    const matricule = await this.generateMatricule(dto.role);

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
        zoneId,
        secteurId,
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
    currentUser?: { role: Role; zoneId?: string | null; secteurId?: string | null },
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      isActive,
      zoneId,
      supervisorId,
      secteurId,
    } = query;
    const skip = (page - 1) * limit;

    // Construction du filtre WHERE
    const where: Record<string, unknown> = {};

    // Filtrage automatique selon le rôle du demandeur
    if (currentUser) {
      switch (currentUser.role) {
        case Role.COORDINATEUR:
          // Ne voit que les users de SA zone
          where.zoneId = currentUser.zoneId;
          break;
        case Role.SUPERVISEUR:
          // Ne voit que les commerciaux de SON secteur
          where.secteurId = currentUser.secteurId;
          where.role = Role.COMMERCIAL;
          break;
        // ADMIN voit tout — pas de filtre automatique
      }
    }

    // Filtres additionnels depuis la query
    if (role && !where.role) where.role = role;
    if (status) where.status = status;
    if (isActive !== undefined) where.isActive = isActive;
    if (zoneId && !where.zoneId) where.zoneId = zoneId;
    if (secteurId && !where.secteurId) where.secteurId = secteurId;
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
    currentUser?: { id?: string; role: Role },
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

    // SUPERVISEUR ne peut voir que ses propres commerciaux
    if (currentUser?.role === Role.SUPERVISEUR) {
      if (user.supervisorId !== currentUser.id) {
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
    // - Pour SUPERVISEUR : hérite du secteur si assigné
    if (newRole === Role.COMMERCIAL && newSupervisorId) {
      const { zoneId, secteurId } = await this.resolveHierarchy(
        newRole,
        newSupervisorId,
        dto.secteurId !== undefined ? dto.secteurId : existing.secteurId,
        existing.zoneId,
      );
      data.zoneId = zoneId;
      data.secteurId = secteurId;
    } else if (newRole === Role.SUPERVISEUR) {
      const newSecteurId =
        dto.secteurId !== undefined ? dto.secteurId : existing.secteurId;
      if (newSecteurId) {
        const { zoneId, secteurId } = await this.resolveHierarchy(
          newRole,
          null,
          newSecteurId,
          existing.zoneId,
        );
        data.zoneId = zoneId;
        data.secteurId = secteurId;
      }
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

    // GARDE-FOU CAS 4b : Refuser désactivation COORDINATEUR si pilote une zone
    if (isDeactivating && existing.role === Role.COORDINATEUR) {
      const coordinatedZone = await this.prisma.zone.findFirst({
        where: { coordinatorId: id },
        select: { name: true },
      });
      if (coordinatedZone) {
        throw new BadRequestException(
          `Ce coordinateur pilote la zone "${coordinatedZone.name}". ` +
            `Retirez-le de la zone d'abord.`,
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
   * Récupère l'équipe d'un superviseur (commerciaux rattachés).
   * Inclut des statistiques de soumissions pour chaque membre.
   */
  async getTeam(supervisorId: string) {
    const members = await this.prisma.user.findMany({
      where: {
        supervisorId,
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

    // Enrichir avec les stats
    return Promise.all(
      members.map(async (m) => {
        const validatedCount = await this.prisma.submission.count({
          where: {
            commercialId: m.id,
            status: { in: ['SUPERVISOR_APPROVED', 'VALIDATED'] },
          },
        });

        return {
          id: m.id,
          fullName: m.fullName,
          matricule: m.matricule,
          phone: m.phone,
          status: m.status,
          submissionCount: m._count.submissions,
          validatedCount,
          lastActivity: m.submissions[0]?.createdAt || null,
        };
      }),
    );
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
   *  - COMMERCIAL : supervisorId obligatoire (zoneId et secteurId hérités automatiquement)
   *  - SUPERVISEUR, COORDINATEUR, ADMIN, CLIENT : aucun rattachement obligatoire
   */
  private async validateRoleAssignments(
    role: Role,
    zoneId?: string | null,
    supervisorId?: string | null,
  ) {
    // Vérifie que la zone existe si fournie
    if (zoneId) {
      const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
      if (!zone) {
        throw new NotFoundException('Zone non trouvée');
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
      // Vérifie que le superviseur a bien un secteur assigné
      if (!supervisor.secteurId) {
        throw new BadRequestException(
          'Le superviseur doit être assigné à un secteur avant de lui rattacher des commerciaux',
        );
      }
    }
  }

  /**
   * Résout la hiérarchie automatiquement :
   * - COMMERCIAL assigné à un superviseur → hérite secteurId et zoneId du superviseur
   * - SUPERVISEUR assigné à un secteur → hérite zoneId du secteur
   * - COORDINATEUR → garde son zoneId tel quel
   */
  private async resolveHierarchy(
    role: Role,
    supervisorId?: string | null,
    secteurId?: string | null,
    zoneId?: string | null,
  ): Promise<{ zoneId: string | null; secteurId: string | null }> {
    // COMMERCIAL : hérite du superviseur
    if (role === Role.COMMERCIAL && supervisorId) {
      const supervisor = await this.prisma.user.findUnique({
        where: { id: supervisorId },
        select: { zoneId: true, secteurId: true },
      });
      if (supervisor) {
        return {
          zoneId: supervisor.zoneId,
          secteurId: supervisor.secteurId,
        };
      }
    }

    // SUPERVISEUR : hérite du secteur
    if (role === Role.SUPERVISEUR && secteurId) {
      const secteur = await this.prisma.secteur.findUnique({
        where: { id: secteurId },
        select: { zoneId: true },
      });
      if (secteur) {
        return {
          zoneId: secteur.zoneId,
          secteurId,
        };
      }
    }

    // Sinon, utilise les valeurs fournies
    return {
      zoneId: zoneId || null,
      secteurId: secteurId || null,
    };
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
}
