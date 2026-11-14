-- Minimal provider interfaces for the in-memory regression database.
-- External email, scheduling and file storage never run here.
create schema auth;
create schema storage;
create schema extensions;
create schema cron;
create schema vault;
create schema net;
create role anon;
create role authenticated;
create role service_role;
create role supabase_auth_admin;
create role supabase_storage_admin;
create extension pgcrypto with schema extensions;
create table auth.users(id uuid primary key default gen_random_uuid(),email text, raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}',email_confirmed_at timestamptz,deleted_at timestamptz,is_anonymous boolean default false,banned_until timestamptz,encrypted_password text,created_at timestamptz default now(),updated_at timestamptz default now());
create table auth.sessions(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users,not_after timestamptz,created_at timestamptz default now());
create function auth.jwt() returns jsonb language sql stable as $$select nullif(current_setting('request.jwt.claims',true),'')::jsonb$$;
create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets,name text,owner uuid,owner_id text,metadata jsonb,created_at timestamptz default now(),updated_at timestamptz default now(),unique(bucket_id,name));
create table vault.decrypted_secrets(name text,decrypted_secret text);
create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$;
grant usage on schema auth,storage to anon,authenticated,service_role;
