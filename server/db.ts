import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Function to initialize database tables if they don't exist
export async function initializeDatabase() {
  try {
    console.log("Checking database tables...");
    
    // Create ingredients table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ingredients (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        category TEXT NOT NULL,
        purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
        expiration_date TIMESTAMP,
        is_low_stock BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create recipes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        serving_size INTEGER NOT NULL,
        cooking_time INTEGER,
        difficulty TEXT NOT NULL,
        instructions TEXT NOT NULL,
        image_url TEXT,
        match_percentage INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create recipe_ingredients table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id VARCHAR NOT NULL REFERENCES recipes(id),
        ingredient_name TEXT NOT NULL,
        required_quantity TEXT NOT NULL,
        available BOOLEAN DEFAULT FALSE
      )
    `);

    // Create cooking_history table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cooking_history (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id VARCHAR NOT NULL REFERENCES recipes(id),
        cooked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ingredients_used TEXT NOT NULL
      )
    `);

    console.log("✓ Database tables initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}