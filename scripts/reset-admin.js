require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // requis pour Supabase
  });

  try {
    await client.connect();
    console.log('✅ Connecté à la base Supabase');

    const checkResult = await client.query(
      `SELECT id, matricule, phone, "fullName", role FROM users WHERE matricule = 'ADM-001'`
    );

    const hashedPassword = await bcrypt.hash('password123', 12);

    if (checkResult.rows.length === 0) {
      console.log('ADMIN non trouvé, création...');
      await client.query(`
        INSERT INTO users (id, matricule, "fullName", phone, email, password, role, status, "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'ADM-001', 'Administrateur', '0700000001', 'admin@aip.ci', $1, 'ADMIN', 'ACTIF', true, NOW(), NOW())
      `, [hashedPassword]);
      console.log('✅ ADMIN créé');
    } else {
      console.log('ADMIN trouvé, réinitialisation...');
      await client.query(
        `UPDATE users SET password = $1, role = 'ADMIN', matricule = 'ADM-001' WHERE phone = '0700000001'`,
        [hashedPassword]
      );
      console.log('✅ Mot de passe et rôle ADMIN réinitialisés');
    }

    console.log('\n📋 Identifiants:');
    console.log('   Phone: 0700000001');
    console.log('   Password: password123');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

resetAdmin();