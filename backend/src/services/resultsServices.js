const db = require("./db");

async function showResults(email, sessionId) {
  try {
    if (sessionId && sessionId !== "") {
      const session = await db.getSessionInfo(sessionId);
      if (!session) return null;

      const history = await db.getSessionHistory(sessionId);
      const results = await db.getSessionResults(sessionId);

      return [
        {
          session,
          history: JSON.parse(history.history).chat_history,
          results: JSON.parse(results.results).results,
        },
      ];
    } else {
      const sessions = await db.getSessionsByUser(email);
      const allResults = [];

      for (const s of sessions) {
        const sid = s.session_id;
        const history = await db.getSessionHistory(sid);
        const results = await db.getSessionResults(sid);

        allResults.push({
          session: s,
          history: JSON.parse(history.history).chat_history,
          results: JSON.parse(results.results).results,
        });
      }

      return allResults;
    }
  } catch (err) {
    console.error("Error in showResults:", err);
    throw err;
  }
}

module.exports = { showResults };
