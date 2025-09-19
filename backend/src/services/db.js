// Example: using Prisma, Sequelize, or raw SQL

async function createUser(email, name, defaultCredits) {
  // Check if user exists
  const existingUser = false; // query DB
  if (existingUser) return false;

  // Insert user with defaultCredits
  return true; // created
}

async function getCredits(email) {
  // Query DB for user credits
  return 10; // example
}

module.exports = { createUser, getCredits };
