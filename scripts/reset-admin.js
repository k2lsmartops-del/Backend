require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAllPasswords() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base Supabase');

    // Compter les utilisateurs concernés (hors ADMIN)
    const countResult = await client.query(
      `SELECT COUNT(*) FROM users WHERE role != 'ADMIN'`
    );
    const totalUsers = parseInt(countResult.rows[0].count, 10);
    console.log(`📊 ${totalUsers} utilisateurs non-ADMIN trouvés`);

    if (totalUsers === 0) {
      console.log('⚠️  Aucun utilisateur à mettre à jour');
      return;
    }

    // Hash unique réutilisé pour tous
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('🔐 Hash généré');

    // Update de tous sauf les ADMIN
    const updateResult = await client.query(
      `UPDATE users SET password = $1, "updatedAt" = NOW() WHERE role != 'ADMIN'`,
      [hashedPassword]
    );

    console.log(`✅ ${updateResult.rowCount} mots de passe réinitialisés`);
    console.log('   (les comptes ADMIN sont intacts)');
    console.log('\n📋 Nouveau mot de passe : password123');
    console.log('   Pour : Coordinateur, Superviseur, Commercial');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

resetAllPasswords();