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

  // ══════════════════════════════════════════════════════════════
  //  COUCHE RÉFÉRENCE — Communes & Quartiers d'Abidjan (seed)
  // ══════════════════════════════════════════════════════════════

  const communesData: { name: string; quartiers: string[] }[] = [
    {
      name: 'Yopougon',
      quartiers: [
        'Sicogi', 'Selmer', 'Wassakara', 'Niangon', 'Sideci',
        'Toits Rouges', 'Banco', 'Azito', 'Port-Bouet 2', 'Koweït',
        'Millionnaire', 'Andokoi', 'Maroc', 'Lievre Rouge',
      ],
    },
    {
      name: 'Cocody',
      quartiers: [
        'Angré', 'Riviera 2', 'Riviera 3', 'Riviera Faya', 'Bonoumin',
        'Danga', 'II Plateaux', 'Vallon', 'Attoban', 'Palmeraie',
        'Blockauss', 'Ambassade', 'Saint-Jean', 'Feh Kessé',
      ],
    },
    {
      name: 'Marcory',
      quartiers: [
        'Zone 4', 'Biétry', 'Anoumabo', 'Résidentiel', 'Zone 3',
      ],
    },
    {
      name: 'Treichville',
      quartiers: [
        'Avenue 12', 'Avenue 17', 'Gare de Bassam', 'Habitat', 'Nanan Yamousso',
      ],
    },
    {
      name: 'Plateau',
      quartiers: [
        'Commerce', 'Cathédrale', 'Indénié', 'Adjamé-Gare',
      ],
    },
    {
      name: 'Abobo',
      quartiers: [
        'Abobo-Gare', 'PK18', 'Avocatier', 'Sagbé', 'Anador',
        'Kennedy', 'Baoulé', 'Banco Nord', 'Anonkoua-Kouté',
      ],
    },
    {
      name: 'Adjamé',
      quartiers: [
        'Liberté', 'Bracodi', 'Williamsville', '220 logements', 'Forum',
      ],
    },
    {
      name: 'Port-Bouët',
      quartiers: [
        'Vridi', 'Gonzagueville', 'Jean Folly', 'Aéroport', 'Derrière-Wharf',
      ],
    },
    {
      name: 'Koumassi',
      quartiers: [
        'Remblais', 'Grand campement', 'Sopim', 'Zone industrielle', 'Sicogi',
      ],
    },
    {
      name: 'Attécoubé',
      quartiers: [
        'Agban', 'Locodjro', 'Santé', 'Abobo-Doumé', 'Boribana',
      ],
    },
  ];

  for (const c of communesData) {
    const commune = await prisma.commune.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name },
    });

    for (const q of c.quartiers) {
      await prisma.quartier.upsert({
        where: { name_communeId: { name: q, communeId: commune.id } },
        update: {},
        create: { name: q, communeId: commune.id },
      });
    }
  }

  console.log(`Seed terminé :`);
  console.log(`  - ${communesData.length} communes`);
  console.log(`  - ${communesData.reduce((s, c) => s + c.quartiers.length, 0)} quartiers`);
  console.log('  - 4 utilisateurs');
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
