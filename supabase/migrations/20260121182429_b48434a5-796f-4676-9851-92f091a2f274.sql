-- Create enum for table types
CREATE TYPE public.table_type AS ENUM ('booth', 'high_table', 'standard', 'standing');

-- Create enum for table allocation status
CREATE TYPE public.table_allocation_status AS ENUM ('available', 'reserved', 'held', 'confirmed');

-- Create enum for menu category
CREATE TYPE public.menu_category AS ENUM ('food', 'drink');

-- Create enum for venue file type
CREATE TYPE public.venue_file_type AS ENUM ('drinks_menu', 'food_menu', 'other');

-- Create venues table
CREATE TABLE public.venues (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    google_maps_link TEXT,
    contact_person TEXT,
    contact_whatsapp TEXT,
    total_capacity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on venues
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for venues
CREATE POLICY "Admins can view venues" ON public.venues FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can insert venues" ON public.venues FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update venues" ON public.venues FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete venues" ON public.venues FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at on venues
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create seating_areas table
CREATE TABLE public.seating_areas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on seating_areas
ALTER TABLE public.seating_areas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for seating_areas
CREATE POLICY "Admins can view seating areas" ON public.seating_areas FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can insert seating areas" ON public.seating_areas FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update seating areas" ON public.seating_areas FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete seating areas" ON public.seating_areas FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at on seating_areas
CREATE TRIGGER update_seating_areas_updated_at
BEFORE UPDATE ON public.seating_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table_configurations (for table types per seating area)
CREATE TABLE public.table_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seating_area_id UUID NOT NULL REFERENCES public.seating_areas(id) ON DELETE CASCADE,
    table_type public.table_type NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    min_spend INTEGER, -- in IDR
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on table_configurations
ALTER TABLE public.table_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for table_configurations
CREATE POLICY "Admins can view table configs" ON public.table_configurations FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can insert table configs" ON public.table_configurations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update table configs" ON public.table_configurations FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete table configs" ON public.table_configurations FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create menu_items table
CREATE TABLE public.menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    category public.menu_category NOT NULL,
    subcategory TEXT,
    name TEXT NOT NULL,
    price_idr INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for menu_items
CREATE POLICY "Admins can view menu items" ON public.menu_items FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can insert menu items" ON public.menu_items FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can update menu items" ON public.menu_items FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete menu items" ON public.menu_items FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at on menu_items
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create venue_files table
CREATE TABLE public.venue_files (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    file_type public.venue_file_type NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on venue_files
ALTER TABLE public.venue_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for venue_files
CREATE POLICY "Admins can view venue files" ON public.venue_files FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can insert venue files" ON public.venue_files FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can delete venue files" ON public.venue_files FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create event_table_allocations table
CREATE TABLE public.event_table_allocations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    seating_area_id UUID NOT NULL REFERENCES public.seating_areas(id) ON DELETE CASCADE,
    table_config_id UUID REFERENCES public.table_configurations(id) ON DELETE SET NULL,
    table_number INTEGER,
    status public.table_allocation_status NOT NULL DEFAULT 'available',
    guest_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on event_table_allocations
ALTER TABLE public.event_table_allocations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_table_allocations
CREATE POLICY "Admins can view table allocations" ON public.event_table_allocations FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert table allocations" ON public.event_table_allocations FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update table allocations" ON public.event_table_allocations FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can delete table allocations" ON public.event_table_allocations FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at on event_table_allocations
CREATE TRIGGER update_event_table_allocations_updated_at
BEFORE UPDATE ON public.event_table_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add venue_id to events table
ALTER TABLE public.events ADD COLUMN venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;

-- Create attribution_settings table for future POS
CREATE TABLE public.attribution_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on attribution_settings
ALTER TABLE public.attribution_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attribution_settings
CREATE POLICY "Admins can view attribution settings" ON public.attribution_settings FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage attribution settings" ON public.attribution_settings FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default attribution settings
INSERT INTO public.attribution_settings (setting_key, setting_value, description)
VALUES 
    ('promoter_commission_rules', '{"default_percentage": 5, "enabled": false}'::jsonb, 'Rules for promoter commission on attributed spend'),
    ('company_attribution', '{"company_name": "Bali Live Sessions", "enabled": true}'::jsonb, 'Settings for company-attributed revenue');