-- Check and fix foreign key constraints for appointments table
-- First, let's check what the foreign key is referencing
SELECT 
  pg_constraint.conname as constraint_name,
  pg_attribute.attname as column_name,
  pg_class.relname as table_name,
  pg_namespace.nspname as schema_name,
  confrelid::regclass as foreign_table_name,
  pg_attribute_f.attname as foreign_column_name
FROM pg_constraint
  JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
  JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
  JOIN pg_attribute ON pg_attribute.attrelid = pg_class.oid 
    AND pg_attribute.attnum = ANY(pg_constraint.conkey)
  JOIN pg_attribute pg_attribute_f ON pg_attribute_f.attrelid = pg_constraint.confrelid
    AND pg_attribute_f.attnum = ANY(pg_constraint.confkey)
WHERE pg_constraint.contype = 'f'
  AND pg_class.relname = 'appointments'
  AND pg_namespace.nspname = 'public';