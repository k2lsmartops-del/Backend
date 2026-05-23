import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
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
  isActive: true,
  zoneId: true,
  supervisorId: true,
  createdAt: true,
  updatedAt: true,
  zone: { select: { id: true, name: true } },
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
   */
  async create(dto: CreateUserDto) {
    // Vérifie les doublons (phone et email)
    await this.checkDuplicates(dto.phone, dto.email);

    // Valide les rattachements selon le rôle
    await this.validateRoleAssignments(dto.role, dto.zoneId, dto.supervisorId);

    // Génère le matricule automatiquement
    const matricule = await this.generateMatricule(dto.role);

    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        matricule,
        fullName: dto.fullName,
        email: dto.email || null,
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role,
        zoneId: dto.zoneId || null,
        supervisorId: dto.supervisorId || null,
      },
      select: USER_SELECT,
    });
  }

  /**
   * Liste paginée des utilisateurs avec filtres.
   */
  async findAll(query: QueryUsersDto) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      zoneId,
      supervisorId,
    } = query;
    const skip = (page - 1) * limit;

    // Construction du filtre WHERE
    const where: Record<string, unknown> = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (zoneId) where.zoneId = zoneId;
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
   */
  async findOne(id: string) {
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

    return user;
  }

  /**
   * Met à jour un utilisateur.
   */
  async update(id: string, dto: UpdateUserDto) {
    // Vérifie que l'utilisateur existe
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifie les doublons si phone ou email changent
    if (dto.phone || dto.email) {
      await this.checkDuplicates(
        dto.phone || existing.phone,
        dto.email !== undefined ? dto.email : existing.email,
        id,
      );
    }

    // Valide les rattachements si le rôle ou la zone/superviseur changent
    const newRole = dto.role || existing.role;
    const newZoneId = dto.zoneId !== undefined ? dto.zoneId : existing.zoneId;
    const newSupervisorId =
      dto.supervisorId !== undefined ? dto.supervisorId : existing.supervisorId;

    if (
      dto.role ||
      dto.zoneId !== undefined ||
      dto.supervisorId !== undefined
    ) {
      await this.validateRoleAssignments(newRole, newZoneId, newSupervisorId);
    }

    // Prépare les données à mettre à jour
    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.zoneId !== undefined) data.zoneId = dto.zoneId;
    if (dto.supervisorId !== undefined) data.supervisorId = dto.supervisorId;

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
   * Ne supprime pas : on met isActive à false.
   */
  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }

  /**
   * Réactive un utilisateur.
   */
  async activate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: USER_SELECT,
    });
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
   *  - SUPERVISEUR : zoneId obligatoire
   *  - COMMERCIAL : zoneId + supervisorId obligatoires
   *  - COORDINATEUR, ADMIN, CLIENT : aucun rattachement requis
   */
  private async validateRoleAssignments(
    role: Role,
    zoneId?: string | null,
    supervisorId?: string | null,
  ) {
    if (role === Role.SUPERVISEUR) {
      if (!zoneId) {
        throw new BadRequestException(
          'Un superviseur doit être rattaché à une zone',
        );
      }
      // Vérifie que la zone existe
      const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
      if (!zone) {
        throw new NotFoundException('Zone non trouvée');
      }
    }

    if (role === Role.COMMERCIAL) {
      if (!zoneId) {
        throw new BadRequestException(
          'Un commercial doit être rattaché à une zone',
        );
      }
      if (!supervisorId) {
        throw new BadRequestException(
          'Un commercial doit être rattaché à un superviseur',
        );
      }
      // Vérifie que la zone existe
      const zone = await this.prisma.zone.findUnique({ where: { id: zoneId } });
      if (!zone) {
        throw new NotFoundException('Zone non trouvée');
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
