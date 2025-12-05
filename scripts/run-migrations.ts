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
    // Migration 1: Add min_quantity column
    console.log("📝 Migration 1: Adding min_quantity column to items table...");
    
    const { error: minQuantityError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add min_quantity column to items table
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'items' AND column_name = 'min_quantity'
          ) THEN
            ALTER TABLE items ADD COLUMN min_quantity INTEGER DEFAULT 1;
            ALTER TABLE items ADD CONSTRAINT items_min_quantity_positive CHECK (min_quantity > 0);
            UPDATE items SET min_quantity = 1 WHERE min_quantity IS NULL;
            ALTER TABLE items ALTER COLUMN min_quantity SET NOT NULL;
            COMMENT ON COLUMN items.min_quantity IS 'Minimum quantity that must be ordered for this item';
            RAISE NOTICE 'Added min_quantity column';
          ELSE
            RAISE NOTICE 'min_quantity column already exists';
          END IF;
        END $$;
      `
    });

    if (minQuantityError) {
      console.error("❌ Error adding min_quantity:", minQuantityError);
    } else {
      console.log("✅ min_quantity column migration complete\n");
    }

    // Migration 2: Add image_url column
    console.log("📝 Migration 2: Adding image_url column to items table...");
    
    const { error: imageUrlError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add image_url column to items table
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'items' AND column_name = 'image_url'
          ) THEN
            ALTER TABLE items ADD COLUMN image_url TEXT;
            COMMENT ON COLUMN items.image_url IS 'URL to product/service image for proposal presentations';
            RAISE NOTICE 'Added image_url column';
          ELSE
            RAISE NOTICE 'image_url column already exists';
          END IF;
        END $$;
      `
    });

    if (imageUrlError) {
      console.error("❌ Error adding image_url:", imageUrlError);
    } else {
      console.log("✅ image_url column migration complete\n");
    }

    // Verify columns exist
    console.log("🔍 Verifying migrations...");
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'items')
      .in('column_name', ['min_quantity', 'image_url']);

    if (verifyError) {
      console.error("❌ Verification failed:", verifyError);
    } else {
      console.log("✅ Verified columns:", columns);
    }

    console.log("\n🎉 All migrations completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();