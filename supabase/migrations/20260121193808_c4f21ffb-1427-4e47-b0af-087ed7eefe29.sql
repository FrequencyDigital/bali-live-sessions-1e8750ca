-- Add venue_manager to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'venue_manager';

-- Create a linking table for venue managers
CREATE TABLE public.venue_managers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, venue_id)
);

-- Enable RLS
ALTER TABLE public.venue_managers ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user manages a venue
CREATE OR REPLACE FUNCTION public.is_venue_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.venue_managers
        WHERE user_id = _user_id
    )
$$;

-- Helper function to get venue IDs managed by user
CREATE OR REPLACE FUNCTION public.get_managed_venue_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT venue_id FROM public.venue_managers WHERE user_id = _user_id
$$;

-- RLS Policies for venue_managers table
CREATE POLICY "Admins can manage venue_managers"
ON public.venue_managers
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view own venue assignments"
ON public.venue_managers
FOR SELECT
USING (user_id = auth.uid());

-- Update venues RLS to allow venue managers to view and update their venues
CREATE POLICY "Venue managers can view their venues"
ON public.venues
FOR SELECT
USING (id IN (SELECT get_managed_venue_ids(auth.uid())));

CREATE POLICY "Venue managers can update their venues"
ON public.venues
FOR UPDATE
USING (id IN (SELECT get_managed_venue_ids(auth.uid())));

-- Allow venue managers to manage seating areas for their venues
CREATE POLICY "Venue managers can view their seating areas"
ON public.seating_areas
FOR SELECT
USING (venue_id IN (SELECT get_managed_venue_ids(auth.uid())));

CREATE POLICY "Venue managers can manage their seating areas"
ON public.seating_areas
FOR ALL
USING (venue_id IN (SELECT get_managed_venue_ids(auth.uid())));

-- Allow venue managers to manage menu items for their venues
CREATE POLICY "Venue managers can view their menu items"
ON public.menu_items
FOR SELECT
USING (venue_id IN (SELECT get_managed_venue_ids(auth.uid())));

CREATE POLICY "Venue managers can manage their menu items"
ON public.menu_items
FOR ALL
USING (venue_id IN (SELECT get_managed_venue_ids(auth.uid())));

-- Allow venue managers to manage venue files for their venues
CREATE POLICY "Venue managers can view their venue files"
ON public.venue_files
FOR SELECT
USING (venue_id IN (SELECT get_managed_venue_ids(auth.uid())));

CREATE POLICY "Venue managers can manage their venue files"
ON public.venue_files
FOR ALL
USING (venue_id IN (SELECT get_managed_venue_ids(auth.uid())));