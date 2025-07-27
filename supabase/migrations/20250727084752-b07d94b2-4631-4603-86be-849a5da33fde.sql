-- Drop and recreate the trigger function with explicit schema references
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function with explicit public schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, display_name, email)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.email
  );
  
  -- If user is a doctor, create doctor profile
  IF (NEW.raw_user_meta_data ->> 'role') = 'doctor' THEN
    INSERT INTO public.doctors (user_id, specialty, bio, location, years_experience)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'specialty', 'General Practice'),
      NEW.raw_user_meta_data ->> 'bio',
      NEW.raw_user_meta_data ->> 'location',
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'years_experience' IS NOT NULL 
        THEN (NEW.raw_user_meta_data ->> 'years_experience')::integer 
        ELSE NULL 
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();