const { Pool, Client } = require("pg");

// const client = new Client({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

const client = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Database connected");
  } catch (error) {
    console.error("Error connecting to database:", error);
  }
}

module.exports = { client, connectDB };
