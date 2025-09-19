const { OAuth2Client } = require("google-auth-library");
const db = require("./db");

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const DEFAULT_CREDITS = parseInt(process.env.DEFAULT_CREDITS || "5", 10);

const client = new OAuth2Client(CLIENT_ID);

async function googleAuth(token) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const name = payload.name || "";
    const email = payload.email;

    // Create or find user in DB
    const created = await db.createUser(email, name, DEFAULT_CREDITS);

    const message = created ? "Registered successfully" : "Logged in successfully";

    const credits = await db.getCredits(email);

    return { name, email, credits, message };
  } catch (err) {
    throw new Error(err.message);
  }
}

async function getCredits(email) {
  try {
    const credits = await db.getCredits(email);
    return { email, credits };
  } catch (err) {
    throw new Error("Failed to fetch credits.");
  }
}

module.exports = { googleAuth, getCredits };
