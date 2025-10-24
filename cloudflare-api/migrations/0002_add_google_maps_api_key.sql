-- Add google_maps_api_key column to clients table
-- This allows each client to have their own Google Maps API key for form autofill

ALTER TABLE clients ADD COLUMN google_maps_api_key TEXT;

-- Optional: Add a default key if you want to use the same key for all clients initially
-- UPDATE clients SET google_maps_api_key = 'YOUR_DEFAULT_KEY_HERE' WHERE google_maps_api_key IS NULL;

