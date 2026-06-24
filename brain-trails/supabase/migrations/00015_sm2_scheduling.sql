-- Migration: SM-2 spaced repetition scheduling for flashcards
-- Adds the fields the SM-2 algorithm needs on top of the existing
-- mastery / next_review / review_count columns.
--
-- ease_factor : SM-2 "EF" (how easy the card is). Starts 2.5, floor 1.3.
-- srs_interval: days until the card is due again (named srs_interval because
--               INTERVAL is a reserved word in Postgres).
-- repetitions : count of consecutive successful reviews (resets to 0 on a lapse).

ALTER TABLE cards ADD COLUMN IF NOT EXISTS ease_factor REAL NOT NULL DEFAULT 2.5;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS srs_interval INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS repetitions INTEGER NOT NULL DEFAULT 0;

-- Helps the "due cards first" ordering / due-count queries.
CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review);
