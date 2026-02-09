const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required (Postgres connection string)");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      columns_json TEXT NOT NULL,
      unit_pcs_label TEXT NOT NULL DEFAULT 'pcs',
      unit_currency_label TEXT NOT NULL DEFAULT 'EUR',
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS unit_pcs_label TEXT NOT NULL DEFAULT 'pcs';
  `);

  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS unit_currency_label TEXT NOT NULL DEFAULT 'EUR';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rows (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      data_json TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
}

function nowIso() {
  return new Date().toISOString();
}

async function createOrder({ slug, title, columns, rowsCount, unitPcsLabel, unitCurrencyLabel }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const createdAt = nowIso();
    const orderRes = await client.query(
      `INSERT INTO orders (slug, title, columns_json, unit_pcs_label, unit_currency_label, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        slug,
        title,
        JSON.stringify(columns),
        unitPcsLabel || "pcs",
        unitCurrencyLabel || "EUR",
        createdAt
      ]
    );
    const orderId = orderRes.rows[0].id;

    const emptyData = "{}";
    for (let i = 0; i < rowsCount; i += 1) {
      await client.query(
        "INSERT INTO rows (order_id, data_json, created_at, updated_at) VALUES ($1, $2, $3, $4)",
        [orderId, emptyData, createdAt, createdAt]
      );
    }
    await client.query("COMMIT");
    return orderId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function getOrderBySlug(slug) {
  const orderRes = await pool.query("SELECT * FROM orders WHERE slug = $1", [slug]);
  if (orderRes.rows.length === 0) return null;
  const order = orderRes.rows[0];

  const rowsRes = await pool.query(
    "SELECT id, data_json, updated_at FROM rows WHERE order_id = $1 ORDER BY id ASC",
    [order.id]
  );

  return {
    id: order.id,
    slug: order.slug,
    title: order.title,
    columns: JSON.parse(order.columns_json),
    unitLabels: {
      pcs: order.unit_pcs_label || "pcs",
      currency: order.unit_currency_label || "EUR"
    },
    rows: rowsRes.rows.map((r) => ({
      id: r.id,
      data: JSON.parse(r.data_json),
      updatedAt: r.updated_at
    }))
  };
}

async function addRow(orderId) {
  const createdAt = nowIso();
  const res = await pool.query(
    "INSERT INTO rows (order_id, data_json, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING id",
    [orderId, "{}", createdAt, createdAt]
  );
  return res.rows[0].id;
}

async function updateRow(orderId, rowId, data) {
  const updatedAt = nowIso();
  const res = await pool.query(
    "UPDATE rows SET data_json = $1, updated_at = $2 WHERE id = $3 AND order_id = $4",
    [JSON.stringify(data || {}), updatedAt, rowId, orderId]
  );
  return res.rowCount > 0;
}

async function deleteRow(orderId, rowId) {
  const res = await pool.query(
    "DELETE FROM rows WHERE id = $1 AND order_id = $2",
    [rowId, orderId]
  );
  return res.rowCount > 0;
}

async function listOrders() {
  const res = await pool.query(
    "SELECT id, slug, title, created_at FROM orders ORDER BY created_at DESC"
  );
  return res.rows;
}

module.exports = {
  initDb,
  createOrder,
  getOrderBySlug,
  addRow,
  updateRow,
  deleteRow,
  listOrders
};
