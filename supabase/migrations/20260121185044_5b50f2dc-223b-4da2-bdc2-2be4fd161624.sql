
-- Add 'promoter' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'promoter';

-- Add payout_details to promoters table (encrypted JSON for bank/wallet info)
ALTER TABLE public.promoters 
ADD COLUMN IF NOT EXISTS payout_details jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create promoter_event_qr table for event-specific QR codes
CREATE TABLE public.promoter_event_qr (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id uuid NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    qr_code_identifier text NOT NULL,
    scans_count integer NOT NULL DEFAULT 0,
    registrations_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(promoter_id, event_id)
);

-- Create commission_ledger table
CREATE TABLE public.commission_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id uuid NOT NULL REFERENCES public.promoters(id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    registrations_count integer NOT NULL DEFAULT 0,
    commission_rate numeric NOT NULL DEFAULT 0,
    amount numeric NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    approved_at timestamp with time zone,
    paid_at timestamp with time zone,
    approved_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(promoter_id, event_id)
);

-- Enable RLS
ALTER TABLE public.promoter_event_qr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is a promoter
CREATE OR REPLACE FUNCTION public.is_promoter(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.promoters
        WHERE user_id = _user_id
          AND is_active = true
    )
$$;

-- Get promoter_id for a user
CREATE OR REPLACE FUNCTION public.get_promoter_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.promoters WHERE user_id = _user_id AND is_active = true LIMIT 1
$$;

-- RLS Policies for promoter_event_qr
CREATE POLICY "Admins can view all promoter event QRs"
ON public.promoter_event_qr FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Promoters can view own event QRs"
ON public.promoter_event_qr FOR SELECT
USING (promoter_id = get_promoter_id(auth.uid()));

CREATE POLICY "Admins can manage promoter event QRs"
ON public.promoter_event_qr FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Promoters can insert own event QRs"
ON public.promoter_event_qr FOR INSERT
WITH CHECK (promoter_id = get_promoter_id(auth.uid()));

-- RLS Policies for commission_ledger
CREATE POLICY "Admins can view all commissions"
ON public.commission_ledger FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Promoters can view own commissions"
ON public.commission_ledger FOR SELECT
USING (promoter_id = get_promoter_id(auth.uid()));

CREATE POLICY "Admins can manage commissions"
ON public.commission_ledger FOR ALL
USING (is_admin(auth.uid()));

-- Add RLS policy for promoters to view their own profile
CREATE POLICY "Promoters can view own promoter record"
ON public.promoters FOR SELECT
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Promoters can update own payout details"
ON public.promoters FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow promoters to view upcoming events (read-only)
CREATE POLICY "Promoters can view upcoming events"
ON public.events FOR SELECT
USING (is_promoter(auth.uid()) AND status = 'upcoming');

-- Update triggers for new tables
CREATE TRIGGER update_promoter_event_qr_updated_at
BEFORE UPDATE ON public.promoter_event_qr
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_ledger_updated_at
BEFORE UPDATE ON public.commission_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
