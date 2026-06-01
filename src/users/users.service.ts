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
   * Retire un commercial de l'équipe du superviseur.
   * Met supervisorId et secteurId à null.
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
      data: { supervisorId: null, secteurId: null, zoneId: null },
      select: USER_SELECT,
    });
  }

  /**
   * Import en masse d'une équipe complète depuis un fichier Excel.
   * Traite les lignes dans l'ordre hiérarchique :
   *   1. COORDINATEUR → crée/rattache la zone
   *   2. SUPERVISEUR  → crée/rattache le secteur dans la zone
   *   3. COMMERCIAL   → rattache au superviseur (par téléphone), hérite secteur/zone
   *
   * Chaque ligne est traitée indépendamment : une erreur sur une ligne
   * n'empêche pas le traitement des autres. Retourne un rapport détaillé.
   */
  async bulkImport(rows: BulkImportRowDto[]) {
    console.log(`[Import] Début de l'import de ${rows.length} ligne(s)`);
    const norm = (v?: string | null) => (v ?? '').toString().trim();
    const rolePriority: Record<string, number> = {
      COORDINATEUR: 1,
      SUPERVISEUR: 2,
      COMMERCIAL: 3,
    };

    type RowResult = {
      row: number;
      status: 'created' | 'error';
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

      try {
        if (!fullName) throw new BadRequestException('Nom complet requis');
        if (!phone) throw new BadRequestException('Téléphone requis');

        // Vérifie si l'utilisateur existe déjà (par téléphone)
        const existingUser = await this.prisma.user.findUnique({
          where: { phone },
        });
        if (existingUser) {
          results.push({
            row: rowNum,
            status: 'error',
            role,
            fullName,
            message: `Utilisateur déjà existant (${existingUser.matricule})`,
          });
          console.log(
            `[Import] Ligne ${rowNum}: Utilisateur ${phone} déjà existant, ignoré`,
          );
          continue;
        }

        // Mot de passe : fourni ou généré par défaut
        const rawPassword = norm(r.password) || this.generateDefaultPassword();
        
        // DEBUG: Log détaillé pour diagnostiquer 401
        console.log('[IMPORT]', {
          ligne: rowNum,
          phone: phone,
          pwdProvided: !!norm(r.password),
          pwdOriginal: r.password,
          pwdAfterNorm: rawPassword,
          pwdBytes: Buffer.from(rawPassword, 'utf8').toString('hex'),
          pwdLen: rawPassword.length,
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
          if (existingEmail) {
            throw new ConflictException(
              `Email ${email} déjà utilisé par ${existingEmail.matricule}`,
            );
          }
        }

        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        if (role === 'COORDINATEUR') {
          const zoneName = norm(r.zone);
          if (!zoneName) {
            throw new BadRequestException(
              'Zone requise pour un coordinateur',
            );
          }

          const matricule = await this.generateMatricule(Role.COORDINATEUR);
          const user = await this.prisma.user.create({
            data: {
              matricule,
              fullName,
              email,
              phone,
              password: hashedPassword,
              role: Role.COORDINATEUR,
              status: AgentStatus.ACTIF,
              isActive: true,
            },
          });

          // Crée ou rattache la zone
          let zone = await this.prisma.zone.findUnique({
            where: { name: zoneName },
          });
          if (!zone) {
            zone = await this.prisma.zone.create({
              data: { name: zoneName, coordinatorId: user.id },
            });
          } else if (!zone.coordinatorId) {
            await this.prisma.zone.update({
              where: { id: zone.id },
              data: { coordinatorId: user.id },
            });
          } else {
            throw new ConflictException(
              `La zone "${zoneName}" a déjà un coordinateur`,
            );
          }

          await this.prisma.user.update({
            where: { id: user.id },
            data: { zoneId: zone.id },
          });

          results.push({
            row: rowNum,
            status: 'created',
            role,
            fullName,
            matricule,
          });
          console.log(
            `[Import] Ligne ${rowNum}: COORDINATEUR ${fullName} créé (${matricule}) - Zone: ${zoneName}`,
          );
        } else if (role === 'SUPERVISEUR') {
          const zoneName = norm(r.zone);
          const secteurName = norm(r.secteur);
          if (!zoneName) {
            throw new BadRequestException('Zone requise pour un superviseur');
          }
          if (!secteurName) {
            throw new BadRequestException(
              'Secteur requis pour un superviseur',
            );
          }

          const zone = await this.prisma.zone.findUnique({
            where: { name: zoneName },
          });
          if (!zone) {
            throw new NotFoundException(
              `Zone "${zoneName}" introuvable (importez d'abord le coordinateur)`,
            );
          }

          const matricule = await this.generateMatricule(Role.SUPERVISEUR);
          const user = await this.prisma.user.create({
            data: {
              matricule,
              fullName,
              email,
              phone,
              password: hashedPassword,
              role: Role.SUPERVISEUR,
              status: AgentStatus.ACTIF,
              isActive: true,
              zoneId: zone.id,
            },
          });

          // Crée ou rattache le secteur
          let secteur = await this.prisma.secteur.findFirst({
            where: { name: secteurName, zoneId: zone.id },
          });
          if (!secteur) {
            secteur = await this.prisma.secteur.create({
              data: {
                name: secteurName,
                zoneId: zone.id,
                supervisorId: user.id,
              },
            });
          } else if (!secteur.supervisorId) {
            await this.prisma.secteur.update({
              where: { id: secteur.id },
              data: { supervisorId: user.id },
            });
          } else {
            throw new ConflictException(
              `Le secteur "${secteurName}" a déjà un superviseur`,
            );
          }

          await this.prisma.user.update({
            where: { id: user.id },
            data: { secteurId: secteur.id },
          });

          results.push({
            row: rowNum,
            status: 'created',
            role,
            fullName,
            matricule,
          });
          console.log(
            `[Import] Ligne ${rowNum}: SUPERVISEUR ${fullName} créé (${matricule}) - Zone: ${zoneName}, Secteur: ${secteurName}`,
          );
        } else if (role === 'COMMERCIAL') {
          const supPhone = norm(r.supervisorPhone);
          if (!supPhone) {
            throw new BadRequestException(
              'Téléphone du superviseur requis pour un commercial',
            );
          }

          const supervisor = await this.prisma.user.findUnique({
            where: { phone: supPhone },
          });
          if (!supervisor || supervisor.role !== Role.SUPERVISEUR) {
            throw new NotFoundException(
              `Superviseur (${supPhone}) introuvable`,
            );
          }
          if (!supervisor.secteurId) {
            throw new BadRequestException(
              "Le superviseur n'a pas de secteur assigné",
            );
          }

          const matricule = await this.generateMatricule(Role.COMMERCIAL);
          await this.prisma.user.create({
            data: {
              matricule,
              fullName,
              email,
              phone,
              password: hashedPassword,
              role: Role.COMMERCIAL,
              status: AgentStatus.ACTIF,
              isActive: true,
              supervisorId: supervisor.id,
              secteurId: supervisor.secteurId,
              zoneId: supervisor.zoneId,
            },
          });

          results.push({
            row: rowNum,
            status: 'created',
            role,
            fullName,
            matricule,
          });
          console.log(
            `[Import] Ligne ${rowNum}: COMMERCIAL ${fullName} créé (${matricule}) - Superviseur: ${supPhone}`,
          );
        } else {
          throw new BadRequestException(
            `Rôle invalide: "${r.role}" (attendu: COORDINATEUR, SUPERVISEUR ou COMMERCIAL)`,
          );
        }
      } catch (e) {
        results.push({
          row: rowNum,
          status: 'error',
          role,
          fullName,
          message: e instanceof Error ? e.message : 'Erreur inconnue',
        });
      }
    }

    // Rétablit l'ordre d'origine pour le rapport
    results.sort((a, b) => a.row - b.row);

    const created = results.filter((r) => r.status === 'created').length;
    const failed = results.filter((r) => r.status === 'error').length;

    console.log(
      `[Import] Terminé: ${created} créé(s), ${failed} échec(s) sur ${results.length} ligne(s)`,
    );

    return {
      total: results.length,
      created,
      failed,
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

  /**
   * DIAGNOSTIC TEMPORAIRE : teste si un mot de passe correspond à un utilisateur.
   * Retourne des informations détaillées pour déboguer les problèmes de connexion.
   * À SUPPRIMER en production.
   */
  async testPassword(phone: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      select: {
        id: true,
        matricule: true,
        fullName: true,
        phone: true,
        password: true,
        isActive: true,
        status: true,
        role: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'Utilisateur non trouvé',
        phone,
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Test variations
    const variations: Record<string, boolean> = {};
    const testVariants = [
      { name: 'trim', value: password.trim() },
      { name: 'no-spaces', value: password.replace(/\s+/g, '') },
      { name: 'NFC', value: password.normalize('NFC') },
      { name: 'NFD', value: password.normalize('NFD') },
    ];

    for (const variant of testVariants) {
      if (variant.value !== password) {
        variations[variant.name] = await bcrypt.compare(
          variant.value,
          user.password,
        );
      }
    }

    return {
      success: isPasswordValid,
      user: {
        matricule: user.matricule,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
      },
      passwordTest: {
        original: isPasswordValid,
        originalLength: password.length,
        originalBytes: Array.from(password).map((c) => c.charCodeAt(0)),
        variations,
      },
      hashInfo: {
        stored: user.password.substring(0, 30) + '...',
      },
    };
  }
}
