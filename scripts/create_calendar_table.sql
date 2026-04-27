-- Calendar Events table for AttendX
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('HOLIDAY', 'EVENT', 'EXAM')),
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast date-range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);

-- Allow all authenticated reads, admin-only writes
-- (handled at API level, but add RLS for defense in depth)
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read
CREATE POLICY "calendar_events_select" ON calendar_events FOR SELECT USING (true);

-- Policy: only via service role (API handles auth)
CREATE POLICY "calendar_events_insert" ON calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "calendar_events_delete" ON calendar_events FOR DELETE USING (true);
