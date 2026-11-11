const { Client } = require('d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/node_modules/pg');

/**
 * Pulizia completa giornate a calendario e statistiche della Stagione 11.
 * - Elimina as_player_stat per STAG = 11
 * - Elimina as_team_stat per STAG = 11
 * - Elimina an_standings per stag = 11
 * - Elimina an_schedule per stag = 11 (Opzione A: rimozione totale calendario)
 * - Reimposta lo stato in league_automation_state per 'import_match_results'
 * - Mantiene intatte: team_formation_history e press_conferences
 */

const STAG = 11;

const client = new Client({
  host: '51.21.189.77',
  port: 6543,
  database: 'postgres',
  user: 'postgres.hzenyasrargpsbuaxmxl',
  password: 'Mko09ijnbhu87ygv./',
  ssl: { rejectUnauthorized: false, servername: 'aws-1-eu-north-1.pooler.supabase.com' },
});

async function cleanSeason11() {
  await client.connect();
  console.log(`\n=== AVVIO PULIZIA GIORNATE E STATISTICHE: Stagione ${STAG} ===\n`);

  try {
    await client.query('BEGIN');

    // 1. Elimina statistiche calciatori per la stagione 11
    const delPlayers = await client.query(
      'DELETE FROM as_player_stat WHERE "STAG" = $1',
      [STAG]
    );
    console.log(`[1/5] as_player_stat: eliminati ${delPlayers.rowCount} record per STAG = ${STAG}`);

    // 2. Elimina statistiche squadre per la stagione 11
    const delTeams = await client.query(
      'DELETE FROM as_team_stat WHERE "STAG" = $1',
      [STAG]
    );
    console.log(`[2/5] as_team_stat: eliminati ${delTeams.rowCount} record per STAG = ${STAG}`);

    // 3. Elimina classifica per la stagione 11
    const delStandings = await client.query(
      'DELETE FROM an_standings WHERE stag = $1',
      [STAG]
    );
    console.log(`[3/5] an_standings: eliminati ${delStandings.rowCount} record per stag = ${STAG}`);

    // 4. Elimina partite e calendario per la stagione 11 (Opzione A)
    const delSchedule = await client.query(
      'DELETE FROM an_schedule WHERE stag = $1',
      [STAG]
    );
    console.log(`[4/5] an_schedule: eliminate ${delSchedule.rowCount} partite a calendario per stag = ${STAG}`);

    // 5. Reset stato importazione in league_automation_state
    await client.query(`
      UPDATE league_automation_state
      SET details = jsonb_build_object(
        'note', 'In attesa di caricamento',
        'cleaned_at', NOW()
      )
      WHERE id = 'import_match_results'
    `);
    console.log(`[5/5] league_automation_state: stato 'import_match_results' reimpostato su 'In attesa'`);

    await client.query('COMMIT');
    console.log(`\nTransaction commit con successo!`);

    // Verifica finale
    const pCheck = await client.query('SELECT count(*) FROM as_player_stat WHERE "STAG" = $1', [STAG]);
    const tCheck = await client.query('SELECT count(*) FROM as_team_stat WHERE "STAG" = $1', [STAG]);
    const stCheck = await client.query('SELECT count(*) FROM an_standings WHERE stag = $1', [STAG]);
    const scCheck = await client.query('SELECT count(*) FROM an_schedule WHERE stag = $1', [STAG]);
    const formCheck = await client.query('SELECT count(*) FROM team_formation_history WHERE stag = $1', [STAG]);
    const pcCheck = await client.query('SELECT count(*) FROM press_conferences WHERE season = $1', [STAG]);

    console.log('\n----------------------------------------');
    console.log(`VERIFICA POST-PULIZIA STAGIONE ${STAG}:`);
    console.log(`- as_player_stat rimasti:      ${pCheck.rows[0].count}`);
    console.log(`- as_team_stat rimasti:        ${tCheck.rows[0].count}`);
    console.log(`- an_standings rimasti:        ${stCheck.rows[0].count}`);
    console.log(`- an_schedule rimasti:         ${scCheck.rows[0].count}`);
    console.log(`- team_formation_history (OK): ${formCheck.rows[0].count}`);
    console.log(`- press_conferences (OK):      ${pcCheck.rows[0].count}`);
    console.log('----------------------------------------\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Errore durante la pulizia della stagione 11, ROLLBACK eseguito:', err);
    throw err;
  } finally {
    await client.end();
  }
}

cleanSeason11().catch(err => {
  console.error(err);
  process.exit(1);
});
