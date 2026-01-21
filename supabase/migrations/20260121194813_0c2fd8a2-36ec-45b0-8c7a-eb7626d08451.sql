-- Create venue manager invites table for pending invitations
CREATE TABLE public.venue_manager_invites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(email, venue_id)
);

-- Enable RLS
ALTER TABLE public.venue_manager_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for venue_manager_invites
CREATE POLICY "Admins can manage venue invites"
ON public.venue_manager_invites
FOR ALL
USING (is_admin(auth.uid()));

-- Function to auto-link venue managers when they sign up
CREATE OR REPLACE FUNCTION public.handle_venue_manager_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record RECORD;
BEGIN
    -- Find any pending invites for this email
    FOR invite_record IN 
        SELECT * FROM public.venue_manager_invites 
        WHERE email = NEW.email AND status = 'pending'
    LOOP
        -- Create the venue manager link
        INSERT INTO public.venue_managers (user_id, venue_id)
        VALUES (NEW.id, invite_record.venue_id)
        ON CONFLICT (user_id, venue_id) DO NOTHING;
        
        -- Add venue_manager role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'venue_manager')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Mark invite as accepted
        UPDATE public.venue_manager_invites
        SET status = 'accepted'
        WHERE id = invite_record.id;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-link on signup
CREATE TRIGGER on_auth_user_created_venue_manager
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_venue_manager_signup();