-- Remove dummy/test appointments that were inserted during development
-- These appointments use test user IDs that don't correspond to real authenticated users

DELETE FROM appointments 
WHERE patient_id = '1a3b20ce-40c6-4a04-919c-64793e42e7a2'
   OR doctor_id = '9412377b-2cd3-45a3-b238-7d6dc6bf6208'
   OR created_at < '2025-07-27 09:00:00';