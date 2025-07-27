-- Update the existing doctor's avatar to a professional medical image
UPDATE public.doctors 
SET avatar_url = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&h=150'
WHERE user_id = '9412377b-2cd3-45a3-b238-7d6dc6bf6208';