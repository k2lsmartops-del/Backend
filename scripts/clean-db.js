// Script pour vider la base de données locale (sauf admin, communes, quartiers)
const { Client } = require('pg');

async function cleanDatabase() {
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

    // 1. Casser l'auto-référence users.supervisorId
    console.log('1. Suppression des références supervisorId...');
    await client.query(`UPDATE users SET "supervisorId" = NULL WHERE matricule != 'ADM-001'`);

    // 2. Supprimer les données transactionnelles
    console.log('2. Suppression des photos...');
    const photos = await client.query('DELETE FROM photos');
    console.log(`   ${photos.rowCount} photos supprimées`);

    console.log('3. Suppression de validation_history...');
    const vh = await client.query('DELETE FROM validation_history');
    console.log(`   ${vh.rowCount} entrées supprimées`);

    console.log('4. Suppression des submissions...');
    const subs = await client.query('DELETE FROM submissions');
    console.log(`   ${subs.rowCount} submissions supprimées`);

    console.log('5. Suppression des refresh_tokens...');
    const tokens = await client.query(`DELETE FROM refresh_tokens WHERE "userId" IN (SELECT id FROM users WHERE matricule != 'ADM-001')`);
    console.log(`   ${tokens.rowCount} tokens supprimés`);

    // 3. Nettoyer les références dans les master data
    console.log('6. Nettoyage des secteurs...');
    await client.query(`UPDATE secteurs SET "supervisorId" = NULL`);

    console.log('7. Nettoyage des zones...');
    await client.query(`UPDATE zones SET "coordinatorId" = NULL`);

    // 4. Supprimer les users (sauf admin)
    console.log('8. Suppression des users (sauf admin)...');
    const users = await client.query(`DELETE FROM users WHERE matricule != 'ADM-001'`);
    console.log(`   ${users.rowCount} utilisateurs supprimés`);

    // Vérification
    const remaining = await client.query('SELECT COUNT(*) as count FROM users');
    const communes = await client.query('SELECT COUNT(*) as count FROM communes');
    const quartiers = await client.query('SELECT COUNT(*) as count FROM quartiers');

    console.log('\n✅ Nettoyage terminé!');
    console.log(`   Utilisateurs restants: ${remaining.rows[0].count}`);
    console.log(`   Communes conservées: ${communes.rows[0].count}`);
    console.log(`   Quartiers conservés: ${quartiers.rows[0].count}`);

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await client.end();
  }
}

cleanDatabase();
