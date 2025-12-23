
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Simple dotenv parser
function loadEnv() {
    const env = {};
    ['.env', '.env.local'].forEach(file => {
        try {
            const envPath = path.resolve(process.cwd(), file);
            if (fs.existsSync(envPath)) {
                const buffer = fs.readFileSync(envPath);
                let content;

                // Check for UTF-16LE (BOM or null bytes)
                if (bufferToString(buffer, 'utf16le').includes('VITE_')) {
                    console.log(`${file} seems to be UTF-16LE`);
                    content = bufferToString(buffer, 'utf16le');
                } else {
                    content = buffer.toString('utf8');
                }

                console.log(`Read ${content.length} chars from ${file}`);

                content.split(/\r?\n/).forEach(line => {
                    // Skip comments and empty lines
                    if (!line || line.trim().startsWith('#')) return;

                    // Match key=value, handling optional 'export ' and whitespace
                    const match = line.match(/^\s*(?:export\s+)?([^=]+)=(.*)$/);
                    if (match) {
                        let key = match[1].trim();
                        let value = match[2].trim();
                        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                        env[key] = value;
                    }
                });
            }
        } catch (e) {
            console.log("Error reading env:", e);
        }
    });
    return env;
}

function bufferToString(buffer, encoding) {
    try {
        return buffer.toString(encoding);
    } catch (e) {
        return "";
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase keys in .env');
    console.log('Found keys:', Object.keys(env));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
    console.log('--- STORAGE DIAGNOSTIC ---');
    console.log('URL:', supabaseUrl);

    const BUCKET = 'company-logos';

    // 1. Check Bucket Exists (List)
    console.log(`\n1. Checking bucket '${BUCKET}' access (LIST)...`);
    const { data: files, error: listError } = await supabase.storage.from(BUCKET).list('', { limit: 5 });

    if (listError) {
        console.error('❌ List failed:', listError.message);
        console.log('   (RLS might be blocking listing)');
    } else {
        console.log(`✅ List successful. Files found: ${files?.length || 0}`);

        if (files && files.length > 0) {
            let testFile = files[0].name;
            console.log(`\n2. Found item: ${testFile}`);

            // If it look like a folder (no extension), drill down
            if (!testFile.includes('.')) {
                console.log(`   '${testFile}' appears to be a folder. Drilling down...`);
                const { data: subFiles } = await supabase.storage.from(BUCKET).list(testFile, { limit: 5 });
                if (subFiles && subFiles.length > 0) {
                    // Might need to go deeper (user_id/visual-rules/file.ext)
                    const subItem = subFiles[0].name;
                    console.log(`   Found sub-item: ${subItem}`);

                    if (!subItem.includes('.')) {
                        console.log(`   '${subItem}' appears to be a folder. Drilling down again...`);
                        const { data: deepFiles } = await supabase.storage.from(BUCKET).list(`${testFile}/${subItem}`, { limit: 1 });
                        if (deepFiles && deepFiles.length > 0) {
                            testFile = `${testFile}/${subItem}/${deepFiles[0].name}`;
                        } else {
                            testFile = null;
                        }
                    } else {
                        testFile = `${testFile}/${subItem}`;
                    }
                } else {
                    testFile = null;
                }
            }

            if (testFile) {
                console.log(`\n   Testing access to file: ${testFile} (READ)`);

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(testFile);
                console.log(`   Generated URL: ${publicUrl}`);

                // Fetch URL
                try {
                    const res = await fetch(publicUrl, { method: 'HEAD' });
                    console.log(`   Fetch Status: ${res.status} ${res.statusText}`);
                    if (res.ok) {
                        console.log("   ✅ Public access confirmed working.");
                    } else {
                        console.log("   ❌ Public access FAILED (404/403).");
                        if (res.status === 400) console.log("      (Bad Request - likely still a folder or invalid path)");
                    }
                } catch (e) {
                    console.log(`   ❌ Fetch error: ${e.message}`);
                }
            } else {
                console.log("   ⚠️ Could not find a file in the folders to test.");
            }
        } else {
            console.log("   ⚠️ Bucket is empty. Cannot test read access.");
        }
    }

    // 3. Attempt Upload (WRITE)
    const testFileName = `verify-test-${Date.now()}.txt`;
    console.log(`\n3. Attempting upload of ${testFileName} (WRITE)...`);
    const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(testFileName, 'test content', { contentType: 'text/plain' });

    if (uploadError) {
        console.log(`   ❌ Upload failed: ${uploadError.message}`);
        console.log('      (Expected if usage is anonymous and RLS requires auth)');
    } else {
        console.log("   ✅ Upload successful");
        // Clean up
        await supabase.storage.from(BUCKET).remove([testFileName]);
        console.log("   (Test file cleaned up)");
    }
}

checkStorage().catch(console.error);
