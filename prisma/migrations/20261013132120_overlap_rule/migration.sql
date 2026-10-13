-- Lets a GiST index compare uuid values with "=".
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- No two CONFIRMED bookings of the same resource may overlap in time.
ALTER TABLE reservations
  ADD CONSTRAINT reservations_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  )
  WHERE (status = 'CONFIRMED');

-- A booking must end after it starts.
ALTER TABLE reservations
  ADD CONSTRAINT reservations_end_after_start CHECK (end_time > start_time);

-- A waitlist entry must end after it starts.
ALTER TABLE waitlist_entries
  ADD CONSTRAINT waitlist_end_after_start CHECK (end_time > start_time);