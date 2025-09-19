const { Pool } = require("pg");

let pool;

// ✅ Connect / Disconnect (similar to FastAPI startup/shutdown)
async function connect() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pool.connect();
  console.log("✅ Connected to PostgreSQL");
}

async function disconnect() {
  if (pool) {
    await pool.end();
    console.log("❌ Disconnected from PostgreSQL");
  }
}

// ========================
// USER FUNCTIONS
// ========================

async function createUser(email, name, credits) {
  const query = `
    INSERT INTO users (email, name, credits)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO NOTHING
    RETURNING email
  `;
  const result = await pool.query(query, [email, name, credits]);
  // if row returned → new user created
  return result.rows.length > 0;
}

async function getCredits(email) {
  const query = "SELECT credits FROM users WHERE email = $1";
  const result = await pool.query(query, [email]);
  return result.rows[0]?.credits || 0;
}

async function updateCredits(email, credits) {
  const query = `
    UPDATE users SET credits = $1
    WHERE email = $2
    RETURNING credits
  `;
  const result = await pool.query(query, [credits, email]);
  return result.rows[0]?.credits || 0;
}

// ========================
// SESSION FUNCTIONS
// ========================

async function createSession(sessionId, email, scenario, company, role, language) {
  const query = `
    INSERT INTO sessions (session_id, user_email, scenario, company, role, language, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING session_id
  `;
  const result = await pool.query(query, [sessionId, email, scenario, company, role, language]);
  return result.rows[0]?.session_id;
}

async function getSessionInfo(sessionId) {
  const query = "SELECT * FROM sessions WHERE session_id = $1";
  const result = await pool.query(query, [sessionId]);
  return result.rows[0] || null;
}

async function getSessionsByUser(email) {
  const query = "SELECT * FROM sessions WHERE user_email = $1";
  const result = await pool.query(query, [email]);
  return result.rows || [];
}

// ========================
// HISTORY & RESULTS
// ========================

async function saveHistory(sessionId, email, conversation, results) {
  const query = `
    INSERT INTO history (session_id, user_email, history, results)
    VALUES ($1, $2, $3::jsonb, $4::jsonb)
  `;
  await pool.query(query, [
    sessionId,
    email,
    JSON.stringify(conversation),
    JSON.stringify(results),
  ]);
}

async function getSessionHistory(sessionId) {
  const query = "SELECT history FROM history WHERE session_id = $1";
  const result = await pool.query(query, [sessionId]);
  return result.rows[0] || null;
}

async function getSessionResults(sessionId) {
  const query = "SELECT results FROM history WHERE session_id = $1";
  const result = await pool.query(query, [sessionId]);
  return result.rows[0] || null;
}

module.exports = {
  connect,
  disconnect,
  createUser,
  getCredits,
  updateCredits,
  createSession,
  getSessionInfo,
  getSessionsByUser,
  saveHistory,
  getSessionHistory,
  getSessionResults,
};
