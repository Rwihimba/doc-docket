-- Update default consultation fee to $10 for existing doctors
UPDATE public.doctors 
SET consultation_fee = 10.00 
WHERE consultation_fee IS NULL;

-- Set default value for consultation_fee column
ALTER TABLE public.doctors 
ALTER COLUMN consultation_fee SET DEFAULT 10.00;