-- Create the access_tokens table
CREATE TABLE access_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  used BOOLEAN DEFAULT false
);

-- Create the function to generate token on new booking
CREATE OR REPLACE FUNCTION generate_access_token()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO access_tokens (booking_id, token) VALUES (NEW.id, gen_random_uuid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER booking_access_token_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_access_token();
