const { Client } = require('./node_modules/pg');
const client = new Client({
  host: 'ep-winter-dream-alxl2vbi-pooler.c-3.eu-central-1.aws.neon.tech',
  port: 5432,
  user: 'neondb_owner',
  password: 'npg_wP8WNIsZU7Ba',
  database: 'neondb',
  ssl: { rejectUnauthorized: false },
});
(async () => {
  try {
    await client.connect();
    const res = await client.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position`);
    console.log(res.rows.map(r => `${r.column_name} | ${r.data_type} | ${r.is_nullable} | ${r.column_default || ''}`).join('\n'));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
