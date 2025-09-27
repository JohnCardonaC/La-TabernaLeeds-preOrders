-- Add notification_log column to bookings table to track email notification attempts
ALTER TABLE bookings ADD COLUMN notification_log JSONB DEFAULT '[]'::jsonb;