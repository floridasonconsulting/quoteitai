/**
 * Migration Runner Script
 * Runs pending database migrations directly via Supabase client
 * 
 * Usage: npx tsx scripts/run-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://onxyqhixydadpnkvdtvm.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueHlxaGl4eWRhZHBua3ZkdHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1OTg2MjksImV4cCI6MjA3NTE3NDYyOX0.EVvMGQc-oRESw31zxliGKxx99tSor0-35nWBs4HjS8c";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n");

  try {
    // Test: Try to query items table to see current schema
    console.log("🔍 Checking current items table schema...");
    
    const { data: sampleItem, error: queryError } = await supabase
      .from('items')
      .select('*')
      .limit(1)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error("❌ Error querying items table:", queryError);
      throw queryError;
    }

    if (sampleItem) {
      console.log("✅ Items table exists");
      console.log("📊 Sample item columns:", Object.keys(sampleItem));
      
      // Check if min_quantity exists
      if ('min_quantity' in sampleItem) {
        console.log("✅ min_quantity column already exists");
      } else {
        console.log("⚠️  min_quantity column missing - needs manual migration");
      }
      
      // Check if image_url exists
      if ('image_url' in sampleItem) {
        console.log("✅ image_url column already exists");
      } else {
        console.log("⚠️  image_url column missing - needs manual migration");
      }
    } else {
      console.log("ℹ️  No items in table yet, cannot verify schema");
    }

    console.log("\n📝 Migration Status:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nThe Supabase anon key doesn't have permission to alter tables.");
    console.log("You need to run these migrations from the Supabase Dashboard:\n");
    console.log("1. Go to: https://supabase.com/dashboard/project/onxyqhixydadpnkvdtvm/editor");
    console.log("2. Click 'SQL Editor' in the left sidebar");
    console.log("3. Run this SQL:\n");
    console.log("-- Add min_quantity column");
    console.log("ALTER TABLE items ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1;");
    console.log("ALTER TABLE items ADD CONSTRAINT items_min_quantity_positive CHECK (min_quantity > 0);");
    console.log("");
    console.log("-- Add image_url column");
    console.log("ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;");
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("ℹ️  Note: The app works fine without these migrations!");
    console.log("   Data saves to IndexedDB locally. Migrations only needed");
    console.log("   if you want to sync minQuantity/imageUrl to Supabase.\n");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

runMigrations();