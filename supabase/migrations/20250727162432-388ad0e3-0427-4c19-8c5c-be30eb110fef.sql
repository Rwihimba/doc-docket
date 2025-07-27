-- Remove the unsplash image and set avatar_url back to null
UPDATE public.doctors 
SET avatar_url = NULL
WHERE user_id = '9412377b-2cd3-45a3-b238-7d6dc6bf6208';