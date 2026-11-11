require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

async function run() {
  console.log("🚀 Connecting to remote Supabase pooler (aws-1) using DATABASE_PASSWORD from env...");
  
  const client = new Client({
    host: process.env.DATABASE_HOST || "aws-1-ap-south-1.pooler.supabase.com",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    user: process.env.DATABASE_USER || "postgres.dyxrwoqslukvwzrmndld",
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME || "postgres",
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("✅ Connected successfully! Reading migration file...");

    // Read initial schema sql
    const schemaPath = path.join(__dirname, "../../../../supabase/migrations/00001_initial_schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("Executing initial schema DDL...");
    await client.query(schemaSql);
    console.log("✅ Initial schema created successfully!");

    // Read schema updates sql
    const updatesPath = path.join(__dirname, "../../../../supabase_schema_updates.sql");
    if (fs.existsSync(updatesPath)) {
      console.log("Reading schema updates file...");
      const updatesSql = fs.readFileSync(updatesPath, "utf8");
      console.log("Executing schema updates DDL...");
      await client.query(updatesSql);
      console.log("✅ Schema updates created successfully!");
    }


    // Read seed sql
    const seedPath = path.join(__dirname, "../../../../supabase/seed/seed.sql");
    if (fs.existsSync(seedPath)) {
      console.log("Reading seed file...");
      const seedSql = fs.readFileSync(seedPath, "utf8");
      console.log("Executing seeding DDL...");
      await client.query(seedSql);
      console.log("✅ Seeding statements executed successfully!");
    }
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Database connection closed.");
  }
}

run();
