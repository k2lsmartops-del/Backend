import { PrismaClient, Role, AgentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // ── Client (MANSA BANK) ──
  const client = await prisma.user.upsert({
    where: { phone: '0700000005' },
    update: {},
    create: {
      matricule: 'CLI-001',
      fullName: 'MANSA BANK',
      phone: '0700000005',
      email: 'client@mansabank.ci',
      password,
      role: Role.CLIENT,
      status: AgentStatus.ACTIF,
      isActive: true,
    },
  });

  console.log('Client MANSA BANK ajouté avec succès :');
  console.log(`  ID: ${client.id}`);
  console.log(`  Téléphone: ${client.phone}`);
  console.log(`  Email: ${client.email}`);
  console.log(`  Mot de passe: password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
