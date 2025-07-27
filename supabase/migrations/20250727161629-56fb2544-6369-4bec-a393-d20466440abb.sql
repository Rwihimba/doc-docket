-- Allow public viewing of basic profile information for doctor cards
CREATE POLICY "Allow public viewing of basic profile info" 
ON public.profiles 
FOR SELECT 
USING (true);