-- Fix access_tokens RLS policy to allow reading valid tokens without role restriction
-- This allows the preorder page to validate tokens from public URLs

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anonymous users can read valid access tokens" ON access_tokens;

-- Create a new policy that allows reading valid tokens for anyone
CREATE POLICY "Anyone can read valid access tokens" ON access_tokens
  FOR SELECT
  USING ((used = false) AND (expires_at > now()));