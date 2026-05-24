import { PrismaClient, Role, AgentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // ── Zone ──
  const zone = await prisma.zone.upsert({
    where: { name: 'Zone Abidjan-Sud' },
    update: {},
    create: {
      name: 'Zone Abidjan-Sud',
      description: 'Zone couvrant Marcory, Treichville, Port-Bouet',
    },
  });

  // ── Admin ──
  await prisma.user.upsert({
    where: { phone: '0700000001' },
    update: {},
    create: {
      matricule: 'ADM-001',
      fullName: 'Admin K2L',
      phone: '0700000001',
      email: 'admin@k2l.ci',
      password,
      role: Role.ADMIN,
      status: AgentStatus.ACTIF,
      isActive: true,
    },
  });

  // ── Coordinateur ──
  const coordinateur = await prisma.user.upsert({
    where: { phone: '0700000002' },
    update: {},
    create: {
      matricule: 'COORD-001',
      fullName: 'Kouame Jean (Coordinateur)',
      phone: '0700000002',
      email: 'coord@k2l.ci',
      password,
      role: Role.COORDINATEUR,
      status: AgentStatus.ACTIF,
      isActive: true,
      zoneId: zone.id,
    },
  });

  // Rattacher le coordinateur a la zone
  await prisma.zone.update({
    where: { id: zone.id },
    data: { coordinatorId: coordinateur.id },
  });

  // ── Superviseur ──
  const superviseur = await prisma.user.upsert({
    where: { phone: '0700000003' },
    update: {},
    create: {
      matricule: 'SUP-001',
      fullName: 'Traore Fatou (Superviseur)',
      phone: '0700000003',
      email: 'sup@k2l.ci',
      password,
      role: Role.SUPERVISEUR,
      status: AgentStatus.ACTIF,
      isActive: true,
      zoneId: zone.id,
    },
  });

  // ── Commercial ──
  await prisma.user.upsert({
    where: { phone: '0700000004' },
    update: {},
    create: {
      matricule: 'AGT-001',
      fullName: 'Diallo Ibrahim (Commercial)',
      phone: '0700000004',
      email: 'agent@k2l.ci',
      password,
      role: Role.COMMERCIAL,
      status: AgentStatus.ACTIF,
      isActive: true,
      zoneId: zone.id,
      supervisorId: superviseur.id,
    },
  });

  console.log('Seed termine - 4 utilisateurs crees');
  console.log('');
  console.log('IDENTIFIANTS DE CONNEXION (mot de passe: password123)');
  console.log('  Admin        -> 0700000001');
  console.log('  Coordinateur -> 0700000002');
  console.log('  Superviseur  -> 0700000003');
  console.log('  Commercial   -> 0700000004');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
