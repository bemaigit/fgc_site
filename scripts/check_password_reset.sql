-- Check the structure of the PasswordReset table
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'PasswordReset'
ORDER BY ordinal_position;
