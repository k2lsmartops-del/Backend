import { validate } from 'class-validator';
import { AgentStatus, Role } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  describe('validation', () => {
    it('should pass with valid data', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;
      dto.status = AgentStatus.ACTIF;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail if fullName is empty', async () => {
      const dto = new CreateUserDto();
      dto.fullName = '';
      dto.phone = '0700000001';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('fullName');
    });

    it('should fail if email is invalid', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.email = 'invalid-email';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail if phone is empty', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('phone');
    });

    it('should fail if password is too short', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.password = 'short';
      dto.role = Role.COMMERCIAL;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should fail if role is invalid', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.password = 'password123';
      dto.role = 'INVALID_ROLE' as Role;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('role');
    });

    it('should fail if status is invalid', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;
      dto.status = 'INVALID_STATUS' as AgentStatus;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('status');
    });

    it('should pass without optional fields', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail if clusterId is not a valid UUID', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;
      dto.clusterId = 'invalid-uuid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('clusterId');
    });

    it('should fail if supervisorId is not a valid UUID', async () => {
      const dto = new CreateUserDto();
      dto.fullName = 'Test User';
      dto.phone = '0700000001';
      dto.password = 'password123';
      dto.role = Role.COMMERCIAL;
      dto.supervisorId = 'invalid-uuid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('supervisorId');
    });
  });
});
