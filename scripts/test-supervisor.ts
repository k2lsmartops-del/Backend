import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function testSupervisor() {
  console.log('👤 Création d\'un superviseur de test...');

  try {
    // Créer le superviseur
    const password = await hash('password123', 10);
    const supervisor = await prisma.user.create({
      data: {
        matricule: 'SUP-TEST-001',
        fullName: 'Superviseur Test',
        phone: '0700000099',
        email: 'superviseur@test.ci',
        password,
        role: 'SUPERVISEUR',
        status: 'ACTIF',
        isActive: true,
      },
    });

    console.log(`✅ Superviseur créé :`);
    console.log(`   - ID: ${supervisor.id}`);
    console.log(`   - Nom: ${supervisor.fullName}`);
    console.log(`   - Matricule: ${supervisor.matricule}`);
    console.log(`   - Téléphone: ${supervisor.phone}`);
    console.log('');

    console.log('⏳ Suppression du superviseur dans 3 secondes...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Supprimer le superviseur
    await prisma.user.delete({
      where: { id: supervisor.id },
    });

    console.log(`✅ Superviseur supprimé : ${supervisor.fullName}`);
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupervisor();
