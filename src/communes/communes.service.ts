import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.commune.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { quartiers: true } },
        zone: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.commune.findUnique({
      where: { id },
      include: {
        quartiers: {
          orderBy: { name: 'asc' },
          include: { secteur: { select: { id: true, name: true } } },
        },
        zone: { select: { id: true, name: true } },
      },
    });
  }
}
