-- Create Custom Types and Enums
CREATE TYPE public.user_role AS ENUM ('super_admin', 'platform_manager', 'pg_owner', 'property_manager', 'tenant');
CREATE TYPE public.bed_status AS ENUM ('Available', 'Occupied', 'Reserved', 'Maintenance');
CREATE TYPE public.booking_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed');
CREATE TYPE public.expense_category AS ENUM ('Electricity', 'Water', 'Salary', 'Internet', 'Repairs', 'Grocery', 'Cleaning');

-- 1. Profiles Table (linked to Supabase Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'tenant'::public.user_role,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT UNIQUE,
    photo TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5. Platform Admins Table
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department TEXT NOT NULL DEFAULT 'Operations',
    permissions TEXT[] NOT NULL DEFAULT '{}',
    region_scope TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PG Owners Table
CREATE TABLE public.pg_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT,
    gst_number TEXT,
    pan_number TEXT,
    aadhaar TEXT,
    verification_status TEXT NOT NULL DEFAULT 'pending',
    subscription_plan TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Buildings Table
CREATE TABLE public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.pg_owners(id) ON DELETE CASCADE,
    building_name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    gender_type TEXT NOT NULL, -- 'Men', 'Women', 'Unisex'
    description TEXT,
    security_deposit NUMERIC NOT NULL DEFAULT 0,
    monthly_rent_starting NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Floors Table
CREATE TABLE public.floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    floor_name TEXT NOT NULL
);

-- 5. Rooms Table
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL, -- e.g., '1-Sharing', '2-Sharing', '3-Sharing', 'Private'
    capacity INTEGER NOT NULL,
    rent NUMERIC NOT NULL,
    attached_bathroom BOOLEAN NOT NULL DEFAULT false,
    ac BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Beds Table (Tenant ID is nullable and references tenants, constraint added later)
CREATE TABLE public.beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    status public.bed_status NOT NULL DEFAULT 'Available'::public.bed_status,
    rent NUMERIC, -- Custom override
    available_from DATE NOT NULL DEFAULT CURRENT_DATE,
    tenant_id UUID
);

-- 7. Tenants Table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.pg_owners(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_leave_date DATE,
    actual_leave_date DATE,
    deposit NUMERIC NOT NULL DEFAULT 0,
    monthly_rent NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active'
);

-- Add Circular Reference Constraint back to Beds table now that Tenants exists
ALTER TABLE public.beds 
ADD CONSTRAINT fk_beds_tenant_id 
FOREIGN KEY (tenant_id) 
REFERENCES public.tenants(id) 
ON DELETE SET NULL;

-- 8. Tenant Documents Table
CREATE TABLE public.tenant_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'Aadhaar', 'PAN', etc.
    document_number TEXT NOT NULL,
    file_url TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false
);

-- 9. Bookings Table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    bed_id UUID NOT NULL REFERENCES public.beds(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    move_in_date DATE NOT NULL,
    booking_status public.booking_status NOT NULL DEFAULT 'Pending'::public.booking_status,
    advance_amount NUMERIC NOT NULL DEFAULT 0
);

-- 10. Rent Payments Table
CREATE TABLE public.rent_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format 'YYYY-MM'
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    payment_method TEXT,
    transaction_id TEXT,
    receipt_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pending'
);

-- 11. Expenses Table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.pg_owners(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    category public.expense_category NOT NULL,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bill_url TEXT,
    remarks TEXT
);

-- 12. Employees Table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.pg_owners(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    salary NUMERIC NOT NULL,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active'
);

-- 13. Amenities Table
CREATE TABLE public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

-- 14. Building Amenities Table (Many-to-Many Join)
CREATE TABLE public.building_amenities (
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (building_id, amenity_id)
);

-- 15. Building Images Table
CREATE TABLE public.building_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0
);

-- 16. Reviews Table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiver_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Bed Status History Table (Enhancement)
CREATE TABLE public.bed_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_id UUID NOT NULL REFERENCES public.beds(id) ON DELETE CASCADE,
    status public.bed_status NOT NULL,
    tenant_id UUID,
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- =========================================================================
-- DATABASE TRIGGERS & SYNC FUNCTIONS
-- =========================================================================

-- Trigger to Sync auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, mobile, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    new.raw_user_meta_data->>'mobile',
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'tenant'::public.user_role),
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to Automatically log changes to beds into bed_status_history
CREATE OR REPLACE FUNCTION public.log_bed_status_change()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (new.status IS DISTINCT FROM old.status) OR (new.tenant_id IS DISTINCT FROM old.tenant_id) THEN
    INSERT INTO public.bed_status_history (bed_id, status, tenant_id, notes)
    VALUES (
      new.id,
      new.status,
      new.tenant_id,
      CASE
        WHEN TG_OP = 'INSERT' THEN 'Bed initialized'
        WHEN new.status = 'Occupied' THEN 'Tenant assigned to bed'
        WHEN new.status = 'Available' AND old.status = 'Occupied' THEN 'Tenant checked out'
        WHEN new.status = 'Maintenance' THEN 'Bed marked for maintenance'
        ELSE 'Status transition to ' || new.status::text
      END
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bed_status_changed
  AFTER INSERT OR UPDATE ON public.beds
  FOR EACH ROW EXECUTE FUNCTION public.log_bed_status_change();


-- =========================================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================================
CREATE INDEX idx_buildings_city ON public.buildings(city);
CREATE INDEX idx_buildings_gender ON public.buildings(gender_type);
CREATE INDEX idx_rooms_floor ON public.rooms(floor_id);
CREATE INDEX idx_beds_room ON public.beds(room_id);
CREATE INDEX idx_tenants_profile ON public.tenants(profile_id);
CREATE INDEX idx_tenants_bed ON public.tenants(bed_id);
CREATE INDEX idx_bookings_tenant_profile ON public.bookings(tenant_profile_id);
CREATE INDEX idx_rent_payments_tenant ON public.rent_payments(tenant_id);
CREATE INDEX idx_expenses_building ON public.expenses(building_id);
CREATE INDEX idx_bed_status_history_bed ON public.bed_status_history(bed_id);


-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_status_history ENABLE ROW LEVEL SECURITY;

-- Helper functions for easier policy definitions
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'::public.user_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_owner_id()
RETURNS UUID AS $$
  SELECT id FROM public.pg_owners WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profiles" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_super_admin());

-- 2. PG Owners Policies
CREATE POLICY "Owners can view their own details" 
ON public.pg_owners FOR SELECT TO authenticated USING (profile_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Owners can insert/update their own details" 
ON public.pg_owners FOR ALL TO authenticated USING (profile_id = auth.uid() OR public.is_super_admin());

-- 3. Buildings Policies
CREATE POLICY "Buildings are viewable by everyone" 
ON public.buildings FOR SELECT USING (true);

CREATE POLICY "Owners can manage their buildings" 
ON public.buildings FOR ALL TO authenticated USING (owner_id = public.get_owner_id() OR public.is_super_admin());

-- 4. Floors Policies
CREATE POLICY "Floors are viewable by everyone" 
ON public.floors FOR SELECT USING (true);

CREATE POLICY "Owners can manage floors" 
ON public.floors FOR ALL TO authenticated USING (
  building_id IN (SELECT id FROM public.buildings WHERE owner_id = public.get_owner_id()) OR public.is_super_admin()
);

-- 5. Rooms Policies
CREATE POLICY "Rooms are viewable by everyone" 
ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Owners can manage rooms" 
ON public.rooms FOR ALL TO authenticated USING (
  floor_id IN (
    SELECT fl.id FROM public.floors fl
    JOIN public.buildings b ON fl.building_id = b.id
    WHERE b.owner_id = public.get_owner_id()
  ) OR public.is_super_admin()
);

-- 6. Beds Policies
CREATE POLICY "Beds are viewable by everyone" 
ON public.beds FOR SELECT USING (true);

CREATE POLICY "Owners can manage beds" 
ON public.beds FOR ALL TO authenticated USING (
  room_id IN (
    SELECT r.id FROM public.rooms r
    JOIN public.floors fl ON r.floor_id = fl.id
    JOIN public.buildings b ON fl.building_id = b.id
    WHERE b.owner_id = public.get_owner_id()
  ) OR public.is_super_admin()
);

-- 7. Tenants Policies
CREATE POLICY "Tenants can view their own records" 
ON public.tenants FOR SELECT TO authenticated USING (profile_id = auth.uid() OR owner_id = public.get_owner_id() OR public.is_super_admin());

CREATE POLICY "Owners can manage tenants" 
ON public.tenants FOR ALL TO authenticated USING (owner_id = public.get_owner_id() OR public.is_super_admin());

-- 8. Tenant Documents Policies
CREATE POLICY "Tenants can manage their own KYC documents" 
ON public.tenant_documents FOR ALL TO authenticated USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE profile_id = auth.uid()) OR 
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = public.get_owner_id()) OR
  public.is_super_admin()
);

-- 9. Bookings Policies
CREATE POLICY "Tenants can view/create their own bookings" 
ON public.bookings FOR SELECT TO authenticated USING (tenant_profile_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "Tenants can create bookings" 
ON public.bookings FOR INSERT TO authenticated WITH CHECK (tenant_profile_id = auth.uid());

CREATE POLICY "Owners can view bookings for their buildings" 
ON public.bookings FOR SELECT TO authenticated USING (
  building_id IN (SELECT id FROM public.buildings WHERE owner_id = public.get_owner_id()) OR public.is_super_admin()
);

CREATE POLICY "Owners and Tenants can update booking status" 
ON public.bookings FOR UPDATE TO authenticated USING (
  tenant_profile_id = auth.uid() OR
  building_id IN (SELECT id FROM public.buildings WHERE owner_id = public.get_owner_id()) OR
  public.is_super_admin()
);

-- 10. Rent Payments Policies
CREATE POLICY "Tenants can view their own rent payments" 
ON public.rent_payments FOR SELECT TO authenticated USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE profile_id = auth.uid()) OR public.is_super_admin()
);

CREATE POLICY "Tenants can insert payment receipts" 
ON public.rent_payments FOR INSERT TO authenticated WITH CHECK (
  tenant_id IN (SELECT id FROM public.tenants WHERE profile_id = auth.uid())
);

CREATE POLICY "Owners can view/manage rent payments" 
ON public.rent_payments FOR ALL TO authenticated USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = public.get_owner_id()) OR public.is_super_admin()
);

-- 11. Expenses Policies
CREATE POLICY "Owners can view/manage expenses" 
ON public.expenses FOR ALL TO authenticated USING (owner_id = public.get_owner_id() OR public.is_super_admin());

-- 12. Employees Policies
CREATE POLICY "Owners can view/manage employees" 
ON public.employees FOR ALL TO authenticated USING (owner_id = public.get_owner_id() OR public.is_super_admin());

-- 13. Amenities Policies
CREATE POLICY "Amenities are viewable by everyone" 
ON public.amenities FOR SELECT USING (true);

CREATE POLICY "Amenities can be managed by super admins only" 
ON public.amenities FOR ALL TO authenticated USING (public.is_super_admin());

-- 14. Building Amenities Policies
CREATE POLICY "Building amenities are viewable by everyone" 
ON public.building_amenities FOR SELECT USING (true);

CREATE POLICY "Owners can manage amenities for their buildings" 
ON public.building_amenities FOR ALL TO authenticated USING (
  building_id IN (SELECT id FROM public.buildings WHERE owner_id = public.get_owner_id()) OR public.is_super_admin()
);

-- 15. Building Images Policies
CREATE POLICY "Building images are viewable by everyone" 
ON public.building_images FOR SELECT USING (true);

CREATE POLICY "Owners can manage building images" 
ON public.building_images FOR ALL TO authenticated USING (
  building_id IN (SELECT id FROM public.buildings WHERE owner_id = public.get_owner_id()) OR public.is_super_admin()
);

-- 16. Reviews Policies
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Active tenants can post reviews" 
ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  tenant_id IN (SELECT id FROM public.tenants WHERE profile_id = auth.uid() AND status = 'active')
);

CREATE POLICY "Tenants can update their own reviews" 
ON public.reviews FOR UPDATE TO authenticated USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE profile_id = auth.uid()) OR public.is_super_admin()
);

-- 17. Notifications Policies
CREATE POLICY "Users can manage their own notifications" 
ON public.notifications FOR ALL TO authenticated USING (
  receiver_profile_id = auth.uid() OR public.is_super_admin()
);

-- 18. Bed Status History Policies
CREATE POLICY "Owners and Super Admins can view bed status history" 
ON public.bed_status_history FOR SELECT TO authenticated USING (
  bed_id IN (
    SELECT b.id FROM public.beds b
    JOIN public.rooms r ON b.room_id = r.id
    JOIN public.floors fl ON r.floor_id = fl.id
    JOIN public.buildings bu ON fl.building_id = bu.id
    WHERE bu.owner_id = public.get_owner_id()
  ) OR public.is_super_admin()
);

-- 19. Used OTPs Table (for replay protection in stateless OTP auth)
CREATE TABLE public.used_otps (
    token_hash TEXT PRIMARY KEY,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and add public access policies
ALTER TABLE public.used_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to used_otps" ON public.used_otps FOR ALL TO public USING (true) WITH CHECK (true);
