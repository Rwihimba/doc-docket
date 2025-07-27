-- Create storage bucket for doctor licenses
INSERT INTO storage.buckets (id, name, public) VALUES ('doctor-licenses', 'doctor-licenses', false);

-- Create policies for doctor license uploads
CREATE POLICY "Users can view their own license documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'doctor-licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own license documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'doctor-licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own license documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'doctor-licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own license documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'doctor-licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add license_url column to doctors table
ALTER TABLE public.doctors ADD COLUMN license_url TEXT;