import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, AgentStatus } from '@prisma/client';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    cluster: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a COORDINATEUR successfully', async () => {
      const dto: CreateUserDto = {
        fullName: 'Test Coordinator',
        phone: '0700000001',
        email: 'test@example.com',
        password: 'password123',
        role: Role.COORDINATEUR,
        status: AgentStatus.ACTIF,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        ...dto,
        matricule: 'COORD-001',
        isActive: true,
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.matricule).toBe('COORD-001');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should create a CLIENT successfully', async () => {
      const dto: CreateUserDto = {
        fullName: 'Test Client',
        phone: '0700000002',
        email: 'client@example.com',
        password: 'password123',
        role: Role.CLIENT,
        status: AgentStatus.ACTIF,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-2',
        ...dto,
        matricule: 'CLI-001',
        isActive: true,
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.matricule).toBe('CLI-001');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if phone already exists', async () => {
      const dto: CreateUserDto = {
        fullName: 'Test User',
        phone: '0700000003',
        email: 'test@example.com',
        password: 'password123',
        role: Role.CLIENT,
      };

      mockPrismaService.user.findFirst.mockResolvedValue({ phone: '0700000003' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if SUPERVISEUR tries to create non-COMMERCIAL', async () => {
      const supervisorUser = { id: 'sup-1', role: Role.SUPERVISEUR, clusterId: 'cluster-1' };
      const adminDto: CreateUserDto = {
        fullName: 'Test Admin',
        phone: '0700000004',
        email: 'admin@example.com',
        password: 'password123',
        role: Role.ADMIN,
      };

      await expect(service.create(adminDto, supervisorUser)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', fullName: 'User 1', role: Role.COMMERCIAL },
        { id: '2', fullName: 'User 2', role: Role.SUPERVISEUR },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should filter by role', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.findAll({ role: Role.COMMERCIAL });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: Role.COMMERCIAL,
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: '1', fullName: 'Test User', role: Role.COMMERCIAL };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      fullName: 'Updated Name',
    };

    it('should update a user successfully', async () => {
      const existingUser = { id: '1', phone: '0700000001', email: 'test@example.com' };
      const updatedUser = { ...existingUser, fullName: 'Updated Name' };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(result.fullName).toBe('Updated Name');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update('999', updateUserDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user successfully', async () => {
      const mockUser = { id: '1', fullName: 'Test User', isActive: true };
      const deactivatedUser = { id: '1', fullName: 'Test User', isActive: false };
      
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(deactivatedUser);

      const result = await service.deactivate('1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('999')).rejects.toThrow(NotFoundException);
    });
  });
});
