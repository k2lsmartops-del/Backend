import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Script pour vérifier les mots de passe stockés vs attendus
 * Usage: npx ts-node scripts/check-passwords.ts
 */

const prisma = new PrismaClient();

async function checkPasswords() {
  console.log('\n=== VERIFICATION MOTS DE PASSE ===\n');

  // Liste des utilisateurs à vérifier
  const testCases = [
    { phone: '0700000002', expectedPwd: 'Passw0rd2', name: 'Kouadio Kouassi' },
    { phone: '0700000003', expectedPwd: 'Passw0rd3', name: 'Konan Koffi' },
    { phone: '0700000004', expectedPwd: 'Passw0rd4', name: 'Yao Adjoua' },
    { phone: '0700000176', expectedPwd: 'Passw0rd267', name: 'Akoua Coulibaly' },
  ];

  for (const test of testCases) {
    console.log(`\n--- ${test.name} (${test.phone}) ---`);

    const user = await prisma.user.findFirst({
      where: { phone: test.phone },
      select: {
        id: true,
        phone: true,
        matricule: true,
        fullName: true,
        password: true,
        isActive: true,
        status: true,
      },
    });

    if (!user) {
      console.log('❌ Utilisateur NON TROUVÉ dans la base');
      console.log(`   → Le téléphone "${test.phone}" n'existe pas`);
      continue;
    }

    console.log(`✓ Utilisateur trouvé:`);
    console.log(`  Matricule: ${user.matricule}`);
    console.log(`  Nom: ${user.fullName}`);
    console.log(`  Phone stocké: "${user.phone}"`);
    console.log(`  isActive: ${user.isActive}`);
    console.log(`  status: ${user.status}`);
    console.log(`  Hash: ${user.password.substring(0, 30)}...`);

    // Test du mot de passe
    console.log(`\nTest mot de passe: "${test.expectedPwd}"`);
    console.log(`  Length: ${test.expectedPwd.length}`);
    console.log(`  Bytes (hex): ${Buffer.from(test.expectedPwd, 'utf8').toString('hex')}`);

    const isValid = await bcrypt.compare(test.expectedPwd, user.password);
    console.log(`  bcrypt.compare: ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);

    if (!isValid) {
      // Test variations
      console.log('\n  Test variations:');
      const variations = [
        { name: 'trim', value: test.expectedPwd.trim() },
        { name: 'no-spaces', value: test.expectedPwd.replace(/\s+/g, '') },
        { name: 'lowercase', value: test.expectedPwd.toLowerCase() },
        { name: 'uppercase', value: test.expectedPwd.toUpperCase() },
      ];

      for (const variant of variations) {
        if (variant.value !== test.expectedPwd) {
          const match = await bcrypt.compare(variant.value, user.password);
          if (match) {
            console.log(`    ✅ ${variant.name}: "${variant.value}" FONCTIONNE!`);
          }
        }
      }

      // Test si le hash correspond à un autre mot de passe de la liste
      console.log('\n  Test croisé (hash correspond à un autre mot de passe?):');
      for (const other of testCases) {
        if (other.phone !== test.phone) {
          const crossMatch = await bcrypt.compare(other.expectedPwd, user.password);
          if (crossMatch) {
            console.log(`    ⚠️  TROUVÉ: Le hash correspond à "${other.expectedPwd}" (${other.name})`);
            console.log(`    → Problème d'ordre d'insertion ou de mapping!`);
          }
        }
      }
    }
  }

  console.log('\n=== FIN VERIFICATION ===\n');
  await prisma.$disconnect();
}

checkPasswords().catch((error) => {
  console.error('Erreur:', error);
  process.exit(1);
});
