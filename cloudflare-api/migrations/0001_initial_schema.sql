-- Initial schema for Cloudflare D1
-- Tourism data tables

CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    excerpt TEXT,
    description_html TEXT,
    image TEXT,
    gallery TEXT, -- JSON array stored as string
    location TEXT,
    type TEXT,
    duration TEXT,
    duration_minutes INTEGER,
    pricing_type TEXT,
    from_price REAL,
    highlights TEXT, -- JSON array stored as string
    itinerary TEXT, -- JSON array stored as string
    inclusions TEXT, -- JSON array stored as string
    exclusions TEXT, -- JSON array stored as string
    faqs TEXT, -- JSON array stored as string
    tags TEXT, -- JSON array stored as string
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    UNIQUE (client_id, slug)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tours_client_id ON tours (client_id);
CREATE INDEX IF NOT EXISTS idx_tours_slug ON tours (slug);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours (status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);

