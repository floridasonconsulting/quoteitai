-- Enable RLS on valid buckets if not already enabled
-- Note: You may need to adjust the bucket name if it's different in your setup
-- This policy assumes 'company-logos' is a public bucket or at least accessible by authenticated users.

-- 1. Create the bucket if it doesn't exist (optional, usually done in UI)
insert into storage.buckets (id, name, public) 
values ('company-logos', 'company-logos', true)
on conflict (id) do update set public = true;

-- 2. Drop existing policies to avoid conflicts (be careful in production)
-- CRITICAL FIX: Explicitly dropping the named policies causing conflicts
drop policy if exists "Give users access to own folder 1q513" on storage.objects;
drop policy if exists "Give users access to own folder" on storage.objects;
drop policy if exists "Authenticated users can upload" on storage.objects;
drop policy if exists "Public Access" on storage.objects;

-- Dropping the specific policies we are about to create to ensure idempotency
drop policy if exists "Authenticated users can upload own logo" on storage.objects;
drop policy if exists "Authenticated users can update own logo" on storage.objects;
drop policy if exists "Authenticated users can delete own logo" on storage.objects;


-- 3. Create Policy: Allow Public Read Access (so proposals can display the logo)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'company-logos' );

-- 4. Create Policy: Allow Authenticated Users to Upload/Update their own logos
-- This assumes the path is company-logos/{user_id}/{filename}
create policy "Authenticated users can upload own logo"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-logos' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Authenticated users can update own logo"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-logos' and
  (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Authenticated users can delete own logo"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-logos' and
  (storage.foldername(name))[1] = auth.uid()::text
);
