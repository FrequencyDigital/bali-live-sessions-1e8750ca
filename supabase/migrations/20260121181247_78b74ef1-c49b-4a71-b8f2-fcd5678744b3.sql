-- Rename the commission column and update its purpose to percentage
ALTER TABLE public.promoters 
RENAME COLUMN commission_per_attendee TO commission_percentage;

-- Update default value to a reasonable percentage (e.g., 10%)
ALTER TABLE public.promoters 
ALTER COLUMN commission_percentage SET DEFAULT 10;

-- Add a comment to clarify the column's purpose
COMMENT ON COLUMN public.promoters.commission_percentage IS 'Commission percentage of total sales (e.g., 5, 10, 15 for 5%, 10%, 15%)';