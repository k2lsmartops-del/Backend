require('dotenv').config();
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function diagnosePassword(phone, password) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connecté à Supabase\n');

    // Récupérer l'utilisateur
    const result = await client.query(
      `SELECT id, matricule, phone, "fullName", role, password 
       FROM users WHERE phone = $1`,
      [phone]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Utilisateur non trouvé avec le phone: ${phone}`);
      return;
    }

    const user = result.rows[0];
    console.log('📋 Utilisateur trouvé:');
    console.log(`   Matricule: ${user.matricule}`);
    console.log(`   Nom: ${user.fullName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Phone: ${user.phone}\n`);

    console.log('🔐 Mot de passe stocké:');
    console.log(`   Hash: ${user.password.substring(0, 50)}...\n`);

    console.log('🧪 Test de vérification:');
    console.log(`   Password fourni: "${password}"`);
    console.log(`   Longueur: ${password.length}`);
    console.log(`   Hex: ${Buffer.from(password, 'utf8').toString('hex')}\n`);

    const isValid = await bcrypt.compare(password, user.password);
    console.log(`   Résultat bcrypt.compare: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);

    // Test de re-hash pour comparaison
    console.log('🔧 Test de re-hash:');
    const newHash = await bcrypt.hash(password, 12);
    const hashMatches = newHash === user.password;
    console.log(`   Nouveau hash: ${newHash.substring(0, 50)}...`);
    console.log(`   Hash identique: ${hashMatches}\n`);

    if (!isValid && !hashMatches) {
      console.log('⚠️  Le mot de passe ne correspond PAS au hash stocké.');
      console.log('   Possibilité: Les données Excel contiennent des caractères invisibles.');
    } else if (!isValid && hashMatches) {
      console.log('⚠️  Bizarre: Le hash généré correspond mais bcrypt.compare échoue.');
    } else {
      console.log('✅ Le mot de passe est correct !');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

// Récupérer les arguments
const phone = process.argv[2];
const password = process.argv[3];

if (!phone || !password) {
  console.log('Usage: node scripts/diagnose-password.js <phone> <password>');
  console.log('Exemple: node scripts/diagnose-password.js 0700000001 monpassword123');
  process.exit(1);
}

diagnosePassword(phone, password);
