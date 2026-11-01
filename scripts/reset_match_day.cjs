const { Client } = require('d:/Users/Stefano/Documents/LCSIM_Website/lcsim-website/node_modules/pg');

/**
 * Script riutilizzabile e parametrico per il reset completo di una giornata di campionato.
 * Uso:
 *   node reset_match_day.js [stag] [week]
 * Esempio predefinito:
 *   node reset_match_day.js 11 1
 */

const STAG = parseInt(process.argv[2] || '11', 10);
const WEEK = parseInt(process.argv[3] || '1', 10);

const client = new Client({
  host: '51.21.189.77',
  port: 6543,
  database: 'postgres',
  user: 'postgres.hzenyasrargpsbuaxmxl',
  password: 'Mko09ijnbhu87ygv./',
  ssl: { rejectUnauthorized: false, servername: 'aws-1-eu-north-1.pooler.supabase.com' },
});

async function resetMatchDay() {
  await client.connect();
  console.log(`\n=== AVVIO RESET GIORNATA: Stagione ${STAG}, Giornata ${WEEK} ===`);

  // 1. Elimina statistiche calciatori per la giornata
  const delPlayers = await client.query(
    'DELETE FROM as_player_stat WHERE "STAG" = $1 AND "WEEK" = $2',
    [STAG, WEEK]
  );
  console.log(`[1/5] as_player_stat: eliminati ${delPlayers.rowCount} record`);

  // 2. Elimina statistiche squadre per la giornata
  const delTeams = await client.query(
    'DELETE FROM as_team_stat WHERE "STAG" = $1 AND "WEEK" = $2',
    [STAG, WEEK]
  );
  console.log(`[2/5] as_team_stat: eliminati ${delTeams.rowCount} record`);

  // 3. Reset classifica (se settimana 1 azzera la stagione, altrimenti ricalcola)
  if (WEEK === 1) {
    const delStandings = await client.query(
      'DELETE FROM an_standings WHERE stag = $1',
      [STAG]
    );
    console.log(`[3/5] an_standings: eliminati ${delStandings.rowCount} record per la stagione ${STAG}`);
  } else {
    try {
      await client.query('SELECT refresh_standings_for_season($1)', [STAG]);
      console.log(`[3/5] an_standings: ricalcolata classifica per stagione ${STAG}`);
    } catch (e) {
      console.warn(`[3/5] an_standings warning:`, e.message);
    }
  }

  // 4. Reset stato partite in an_schedule per la giornata
  const updateSchedule = await client.query(`
    UPDATE an_schedule
    SET standings_processed = false,
        unlock_at = NULL
    WHERE stag = $1 AND week = $2
  `, [STAG, WEEK]);
  console.log(`[4/5] an_schedule: resettate ${updateSchedule.rowCount} partite`);

  // 5. Reset stato importazione in league_automation_state
  await client.query(`
    UPDATE league_automation_state
    SET details = jsonb_set(
      COALESCE(details, '{}'::jsonb),
      '{note}',
      '"In attesa di caricamento"'::jsonb
    )
    WHERE id = 'import_match_results'
  `);
  console.log(`[5/5] league_automation_state: stato 'import_match_results' reimpostato su 'In attesa'`);

  // Riepilogo finale
  const pCheck = await client.query('SELECT count(*) FROM as_player_stat WHERE "STAG" = $1 AND "WEEK" = $2', [STAG, WEEK]);
  const tCheck = await client.query('SELECT count(*) FROM as_team_stat WHERE "STAG" = $1 AND "WEEK" = $2', [STAG, WEEK]);
  const sCheck = await client.query('SELECT home, away, date, standings_processed, unlock_at FROM an_schedule WHERE stag = $1 AND week = $2 ORDER BY home', [STAG, WEEK]);

  console.log('\n----------------------------------------');
  console.log(`VERIFICA DB POST-RESET S${STAG} W${WEEK}:`);
  console.log(`- as_player_stat rimasti: ${pCheck.rows[0].count}`);
  console.log(`- as_team_stat rimasti:   ${tCheck.rows[0].count}`);
  console.log(`- partite in schedule:    ${sCheck.rows.length}`);
  sCheck.rows.forEach(r => {
    console.log(`  * ${r.home} vs ${r.away} | processed: ${r.standings_processed} | unlock_at: ${r.unlock_at}`);
  });
  console.log('----------------------------------------\n');

  await client.end();
}

resetMatchDay().catch(err => {
  console.error('Errore durante il reset della giornata:', err);
  process.exit(1);
});
