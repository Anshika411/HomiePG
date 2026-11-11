-- 0. Alter user_role enum to add new roles if they don't exist
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'platform_manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'property_manager';

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

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.visitor_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- 6. Create public policies for new tables (allow authenticated users full access for sandbox demo)
CREATE POLICY "Allow authenticated users access to visitor_passes" 
ON public.visitor_passes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users access to maintenance_tickets" 
ON public.maintenance_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users access to user_rewards" 
ON public.user_rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Add photo attachments support for maintenance tickets
ALTER TABLE public.maintenance_tickets ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 8. Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department TEXT NOT NULL DEFAULT 'Operations',
    permissions TEXT[] NOT NULL DEFAULT '{}',
    region_scope TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Enable RLS and create public policies for admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users access to admins" 
ON public.admins FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Create used_otps table for stateless OTP verification
CREATE TABLE IF NOT EXISTS public.used_otps (
    token_hash TEXT PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.used_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to used_otps" ON public.used_otps FOR ALL TO public USING (true) WITH CHECK (true);

-- 11. Create verification_tasks table
CREATE TABLE IF NOT EXISTS public.verification_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL, -- 'gps_logging' | 'video_verification' | 'physical_inspection'
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected'
    gps_coordinates POINT,
    video_url TEXT,
    audit_notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and create public policy
ALTER TABLE public.verification_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users access to verification_tasks" 
ON public.verification_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
