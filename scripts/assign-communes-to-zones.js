// Script pour affecter les communes aux zones
const { Client } = require('pg');

async function assignCommunesToZones() {
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

    // Récupérer toutes les zones
    const zonesResult = await client.query('SELECT id, name FROM zones WHERE "isActive" = true');
    const zones = zonesResult.rows;
    console.log(`\n${zones.length} zones trouvées`);

    // Récupérer toutes les communes
    const communesResult = await client.query('SELECT id, name, "zoneId" FROM communes');
    const communes = communesResult.rows;
    console.log(`${communes.length} communes trouvées`);

    if (zones.length === 0) {
      console.log('⚠️ Aucune zone trouvée. Création d\'une zone par défaut...');
      await client.query(`
        INSERT INTO zones (id, name, "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Zone par défaut', true, NOW(), NOW())
      `);
      // Récupérer à nouveau
      const newZones = await client.query('SELECT id, name FROM zones WHERE "isActive" = true');
      zones.push(...newZones.rows);
    }

    // Affecter les communes aux zones (répartir équitablement)
    let zoneIndex = 0;
    const updated = [];

    for (const commune of communes) {
      if (!commune.zoneId) {
        const zone = zones[zoneIndex % zones.length];
        await client.query(
          'UPDATE communes SET "zoneId" = $1 WHERE id = $2',
          [zone.id, commune.id]
        );
        console.log(`  ✓ ${commune.name} → ${zone.name}`);
        updated.push(commune.name);
        zoneIndex++;
      }
    }

    console.log(`\n✅ ${updated.length} communes affectées aux zones`);

    // Vérification
    const verifResult = await client.query(`
      SELECT c.name as commune, z.name as zone 
      FROM communes c 
      LEFT JOIN zones z ON c."zoneId" = z.id 
      WHERE c."zoneId" IS NOT NULL
    `);
    const verif = verifResult.rows;

    console.log('\n📊 Résumé final:');
    const parZone = {};
    verif.forEach(row => {
      const zoneName = row.zone;
      parZone[zoneName] = (parZone[zoneName] || 0) + 1;
    });

    Object.entries(parZone).forEach(([zone, count]) => {
      console.log(`  ${zone}: ${count} commune(s)`);
    });

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await client.end();
  }
}

assignCommunesToZones();
