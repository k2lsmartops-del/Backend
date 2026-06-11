import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, SubmissionStatus, SubmissionType } from '@prisma/client';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { QuerySubmissionsDto } from './dto/query-submissions.dto';

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    submission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  const mockAdminUser: any = {
    id: 'admin-1',
    role: Role.ADMIN,
    fullName: 'Admin User',
    matricule: 'ADM-001',
    phone: '0700000001',
    email: 'admin@k2l.ci',
    status: 'ACTIF',
    isActive: true,
    clusterId: null,
    supervisorId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCommercialUser: any = {
    id: 'comm-1',
    role: Role.COMMERCIAL,
    fullName: 'Commercial User',
    matricule: 'AGT-001',
    phone: '0700000002',
    email: 'commercial@k2l.ci',
    status: 'ACTIF',
    isActive: true,
    clusterId: 'cluster-1',
    supervisorId: 'sup-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: 'CACHE_MANAGER',
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createSubmissionDto: CreateSubmissionDto = {
      type: SubmissionType.PROSPECT,
      clientUuid: 'client-uuid-1',
      prospectFullName: 'John Doe',
      prospectPhone: '0700000001',
      prospectProfession: 'Commercant',
      commune: 'Yopougon',
      quartier: 'Sicogi',
      latitude: 5.36,
      longitude: -4.03,
      gpsAccuracy: 10,
      requestedStatus: 'DRAFT',
    };

    it('should create a PROSPECT submission successfully', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);
      mockPrismaService.submission.findFirst.mockResolvedValue(null);
      mockPrismaService.submission.create.mockResolvedValue({
        id: 'sub-1',
        ...createSubmissionDto,
        status: SubmissionStatus.DRAFT,
        commercialId: 'comm-1',
      });

      const result = await service.create(createSubmissionDto, mockCommercialUser);

      expect(result).toBeDefined();
      expect(mockPrismaService.submission.create).toHaveBeenCalled();
    });

    it('should return existing submission if clientUuid already exists (idempotent)', async () => {
      const existingSubmission = {
        id: 'sub-1',
        ...createSubmissionDto,
        status: SubmissionStatus.DRAFT,
      };
      mockPrismaService.submission.findUnique.mockResolvedValue(existingSubmission);

      const result: any = await service.create(createSubmissionDto, mockCommercialUser);

      expect(result._idempotent).toBe(true);
      expect(mockPrismaService.submission.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated submissions for ADMIN', async () => {
      const mockSubmissions = [
        { id: '1', type: SubmissionType.PROSPECT, status: SubmissionStatus.VALIDATED },
        { id: '2', type: SubmissionType.MARCHAND, status: SubmissionStatus.SUBMITTED },
      ];
      mockPrismaService.submission.findMany.mockResolvedValue(mockSubmissions);
      mockPrismaService.submission.count.mockResolvedValue(2);

      const query: QuerySubmissionsDto = { page: 1, limit: 10 };
      const result = await service.findAll(query, mockAdminUser);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockPrismaService.submission.findMany.mockResolvedValue([]);
      mockPrismaService.submission.count.mockResolvedValue(0);

      await service.findAll({ status: SubmissionStatus.VALIDATED }, mockAdminUser);

      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: SubmissionStatus.VALIDATED,
          }),
        })
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.submission.findMany.mockResolvedValue([]);
      mockPrismaService.submission.count.mockResolvedValue(0);

      await service.findAll({ type: SubmissionType.PROSPECT }, mockAdminUser);

      expect(mockPrismaService.submission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: SubmissionType.PROSPECT,
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a submission by id for ADMIN', async () => {
      const mockSubmission = {
        id: '1',
        type: SubmissionType.PROSPECT,
        status: SubmissionStatus.VALIDATED,
        prospectFullName: 'John Doe',
      };
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);

      const result = await service.findOne('1', mockAdminUser);

      expect(result).toEqual(mockSubmission);
      expect(mockPrismaService.submission.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999', mockAdminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('validate', () => {
    it('should validate a submission successfully for COORDINATEUR', async () => {
      const mockSubmission = {
        id: '1',
        status: SubmissionStatus.SUBMITTED,
        type: SubmissionType.PROSPECT,
        commercialId: 'comm-1',
      };
      const mockCoordinatorUser: any = {
        ...mockAdminUser,
        role: Role.COORDINATEUR,
        id: 'coord-1',
      };
      
      mockPrismaService.submission.findUnique.mockResolvedValue(mockSubmission);
      mockPrismaService.submission.update.mockResolvedValue({
        ...mockSubmission,
        status: SubmissionStatus.VALIDATED,
        validatorId: 'coord-1',
        validatedAt: new Date(),
      });

      const result = await service.validate('1', mockCoordinatorUser, 'VALIDATE');

      expect(result.status).toBe(SubmissionStatus.VALIDATED);
      expect(mockPrismaService.submission.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if submission not found', async () => {
      const mockCoordinatorUser: any = {
        ...mockAdminUser,
        role: Role.COORDINATEUR,
      };
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(service.validate('999', mockCoordinatorUser, 'VALIDATE')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateData = {
      prospectFullName: 'Updated Name',
      observations: 'Updated observations',
    };

    it('should update a submission successfully for owner', async () => {
      const existingSubmission = {
        id: '1',
        status: SubmissionStatus.DRAFT,
        commercialId: 'comm-1',
      };
      const updatedSubmission = { ...existingSubmission, ...updateData };

      mockPrismaService.submission.findUnique.mockResolvedValue(existingSubmission);
      mockPrismaService.submission.update.mockResolvedValue(updatedSubmission);

      const result = await service.update('1', updateData, mockCommercialUser);

      expect(result.prospectFullName).toBe('Updated Name');
      expect(mockPrismaService.submission.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrismaService.submission.findUnique.mockResolvedValue(null);

      await expect(service.update('999', updateData, mockCommercialUser)).rejects.toThrow(NotFoundException);
    });
  });
});
