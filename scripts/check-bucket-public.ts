
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket() {
    console.log('Checking "company-logos" bucket status...');

    // 1. Upload a test file
    const testFileName = `test-public-check-${Date.now()}.txt`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(testFileName, 'test content', { upsert: true });

    if (uploadError) {
        console.error('❌ Upload failed! Do you have the right permissions?');
        console.error(uploadError);
        return;
    }

    console.log('✓ Upload successful');

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(testFileName);

    console.log(`Checking URL: ${publicUrl}`);

    // 3. Fetch it (mimic browser)
    try {
        const response = await fetch(publicUrl, { method: 'HEAD' });

        if (response.ok) {
            console.log('✅ SUCCESS: Bucket is PUBLIC. The URL is accessible (Status 200).');
        } else {
            console.error(`❌ FAILURE: Bucket appears PRIVATE. Access returned Status ${response.status}.`);
            console.error('FIX REQUIRED: You MUST run the "force_bucket_public.sql" script in your Supabase Dashboard.');
        }
    } catch (err) {
        console.error('Error fetching URL:', err);
    }

    // Clean up
    await supabase.storage.from('company-logos').remove([testFileName]);
}

checkBucket();
