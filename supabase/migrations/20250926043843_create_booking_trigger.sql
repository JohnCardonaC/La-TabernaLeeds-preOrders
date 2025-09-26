-- Create the trigger function
CREATE OR REPLACE FUNCTION send_preorder_email_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function using pg_net
  PERFORM
    net.http_post(
      url := 'https://qvowtveyzsmewvhfbbfm.supabase.co/functions/v1/send-preorder-email',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM vault.secrets WHERE name = 'service_role_key')
      ),
      body := json_build_object('record', NEW)::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on bookings table
CREATE TRIGGER trigger_send_preorder_email
AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION send_preorder_email_trigger();