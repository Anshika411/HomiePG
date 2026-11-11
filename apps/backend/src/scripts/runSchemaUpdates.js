require("dotenv").config();
const { Client } = require("pg");

async function run() {
  console.log("🚀 Connecting to remote Supabase pooler (aws-1) using DATABASE_PASSWORD...");
  
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
    console.log("✅ Connected successfully! Running database schema updates...");

    const sql = `
      -- 1. Alter profiles table to add gender if it doesn't exist
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;

      -- 2. Create visitor_passes table
      CREATE TABLE IF NOT EXISTS public.visitor_passes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
          visitor_name TEXT NOT NULL,
          visit_date DATE NOT NULL,
          visit_time TEXT,
          purpose TEXT,
          pass_code TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 3. Create maintenance_tickets table
      CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'Pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      -- 4. Create user_rewards table
      CREATE TABLE IF NOT EXISTS public.user_rewards (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
          points INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    await client.query(sql);
    console.log("✅ Schema updates executed successfully!");

  } catch (error) {
    console.error("❌ Schema update failed:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Database connection closed.");
  }
}

run();
