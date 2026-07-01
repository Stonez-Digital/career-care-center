/*
# Make donor fields nullable to support anonymous donations

Anonymous donations set donor_name = 'Anonymous' and leave
donor_email, donor_phone, organization as NULL.
*/

-- Make donor_email nullable
ALTER TABLE donations ALTER COLUMN donor_email DROP NOT NULL;

-- Add donor_phone and organization columns (nullable)
ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor_phone text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS organization text;

-- Set default for donor_name so anonymous donations can use 'Anonymous'
ALTER TABLE donations ALTER COLUMN donor_name SET DEFAULT 'Anonymous';
