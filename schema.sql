-- ============================================================================
-- DeepSyncSocial - Cloudflare D1 Database Schema
-- ============================================================================
--
-- This schema defines the `waitlist` table for storing user signup information.
--
-- Usage:
--   wrangler d1 execute deepsync --file schema.sql
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    struggle TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_unique ON waitlist(email);

-- Create index for chronological queries
CREATE INDEX IF NOT EXISTS idx_created_at ON waitlist(created_at DESC);

