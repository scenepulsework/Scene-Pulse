/**
 * Null out any placeholder contact_email values that were set by a previous
 * backfill run (those ending in @venue-contact.scenepulse.app). Real business
 * contact emails must be populated by ScenePulse staff via the admin API or
 * directly in the database; placeholder addresses should not receive live codes.
 */
import { pool } from "@workspace/db";

const client = await pool.connect();
try {
  const res = await client.query(`
    UPDATE venues
    SET contact_email = NULL
    WHERE contact_email LIKE '%@venue-contact.scenepulse.app'
    RETURNING id, name
  `);
  console.log(`Cleared placeholder contactEmail for ${res.rowCount} venues.`);
  if (res.rows.length > 0) {
    console.log(
      "Sample cleared:",
      res.rows
        .slice(0, 3)
        .map((r: { name: string }) => r.name)
        .join(", "),
    );
  }
} finally {
  client.release();
  await pool.end();
}
process.exit(0);
