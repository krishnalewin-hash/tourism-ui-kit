-- Migration: Initial Schema
-- Created: 2025-01-23

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  website TEXT,
  api_key TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
  branding_logo TEXT,
  branding_primary_color TEXT DEFAULT '#FF6B35',
  branding_secondary_color TEXT DEFAULT '#004E89',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  excerpt TEXT,
  description_html TEXT,
  image TEXT,
  gallery TEXT, -- JSON array of image URLs
  location TEXT,
  type TEXT,
  duration TEXT,
  duration_minutes INTEGER,
  pricing_type TEXT DEFAULT 'per_person' CHECK(pricing_type IN ('per_person', 'per_group', 'fixed')),
  from_price REAL,
  highlights TEXT, -- JSON array
  itinerary TEXT, -- JSON array
  inclusions TEXT, -- JSON array
  exclusions TEXT, -- JSON array
  faqs TEXT, -- JSON array
  tags TEXT, -- JSON array
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'draft')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE(client_id, slug)
);

-- Indexes for performance
CREATE INDEX idx_tours_client_id ON tours(client_id);
CREATE INDEX idx_tours_slug ON tours(slug);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_type ON tours(type);
CREATE INDEX idx_clients_slug ON clients(slug);
CREATE INDEX idx_clients_api_key ON clients(api_key);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_clients_timestamp 
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER update_tours_timestamp 
AFTER UPDATE ON tours
FOR EACH ROW
BEGIN
  UPDATE tours SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

