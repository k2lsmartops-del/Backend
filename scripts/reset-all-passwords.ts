import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Script pour réinitialiser tous les mots de passe à "password123"
 * Usage: npx ts-node scripts/reset-all-passwords.ts
 */

const prisma = new PrismaClient();

async function resetAllPasswords() {
  console.log('\n=== RESET TOUS LES MOTS DE PASSE ===\n');
  console.log('Nouveau mot de passe: password123\n');

  // Récupérer tous les utilisateurs
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      fullName: true,
      role: true,
    },
    orderBy: { fullName: 'asc' },
  });

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé dans la base');
    await prisma.$disconnect();
    return;
  }

  console.log(`✓ ${users.length} utilisateurs trouvés\n`);

  // Hasher le mot de passe par défaut
  const defaultPassword = 'password123';
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  console.log('Mot de passe hashé avec succès\n');

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      console.log(`✅ ${user.fullName} (${user.role}) - ${user.phone}`);
      successCount++;

    } catch (error) {
      console.error(`❌ Erreur pour ${user.fullName}:`, error);
      errorCount++;
    }
  }

  console.log('\n=== RÉSUMÉ ===');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📊 Total: ${users.length}`);
  console.log('\n=== FIN ===\n');
  console.log('Tous les utilisateurs peuvent maintenant se connecter avec: password123\n');

  await prisma.$disconnect();
}

resetAllPasswords().catch((error) => {
  console.error('Erreur:', error);
  process.exit(1);
});
