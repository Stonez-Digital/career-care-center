/*
# Add anonymous donation support to donations table
*/
ALTER TABLE donations ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;
