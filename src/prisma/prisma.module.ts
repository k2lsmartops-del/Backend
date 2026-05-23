import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module Prisma global.
 * PrismaService est disponible dans tous les modules sans import explicite.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
