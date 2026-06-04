// Script pour réinitialiser le mot de passe ADMIN
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function resetAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'offo_ange',
    password: 'offoange',
    database: 'commerciale',
  });

  try {
    await client.connect();
    console.log('Connecté à la base de données');

    // Vérifier si ADMIN existe
    const checkResult = await client.query(
      "SELECT id, matricule, phone, \"fullName\", role FROM users WHERE matricule = 'ADM-001'"
    );

    if (checkResult.rows.length === 0) {
      console.log('ADMIN non trouvé, création...');
      
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      await client.query(`
        INSERT INTO users (id, matricule, "fullName", phone, email, password, role, status, "isActive", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          'ADM-001',
          'Administrateur',
          '0700000001',
          'admin@aip.ci',
          $1,
          'ADMIN',
          'ACTIF',
          true,
          NOW(),
          NOW()
        )
      `, [hashedPassword]);
      
      console.log('✅ ADMIN créé avec succès!');
    } else {
      console.log('ADMIN trouvé:', checkResult.rows[0]);
      console.log('Réinitialisation du mot de passe...');
      
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      await client.query(
        "UPDATE users SET password = $1, role = 'ADMIN', matricule = 'ADM-001' WHERE phone = '0700000001'",
        [hashedPassword]
      );
      
      console.log('✅ Mot de passe et rôle ADMIN réinitialisés!');
    }

    console.log('\n📋 Identifiants ADMIN:');
    console.log('   Phone: 0700000001');
    console.log('   Password: password123');

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await client.end();
  }
}

resetAdmin();
