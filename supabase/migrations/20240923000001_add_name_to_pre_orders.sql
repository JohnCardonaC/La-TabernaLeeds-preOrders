-- Add name column to pre_orders table to link pre-orders to specific names
ALTER TABLE pre_orders ADD COLUMN name TEXT NOT NULL DEFAULT '';
