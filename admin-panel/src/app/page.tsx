import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { format, startOfDay, endOfDay } from 'date-fns';
import DashboardView from './dashboard-view';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const cookieStore = cookies();
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const selectedDate = searchParams.date
    ? new Date(searchParams.date)
    : new Date();

  // Adjust for timezone differences by setting time to noon
  selectedDate.setHours(12, 0, 0, 0);

  const startDate = format(startOfDay(selectedDate), 'yyyy-MM-dd HH:mm:ss');
  const endDate = format(endOfDay(selectedDate), 'yyyy-MM-dd HH:mm:ss');

  // Fetch bookings for the selected date range
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .gte('booking_date', startDate)
    .lte('booking_date', endDate)
    .order('booking_time', { ascending: true });

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError.message);
    // Return view with empty bookings array on error
    return <DashboardView bookings={[]} />;
  }

  // Fetch pre-orders to determine status
  const bookingIds = bookings?.map((b) => b.id) || [];
  const { data: preOrders, error: preOrdersError } = await supabase
    .from('pre_orders')
    .select('booking_id')
    .in('booking_id', bookingIds);

  if (preOrdersError) {
    console.error('Error fetching pre-orders:', preOrdersError.message);
    // Continue without status information on error
  }

  const preOrderBookingIds = new Set(preOrders?.map((p) => p.booking_id));

  const bookingsWithStatus = bookings?.map((booking) => ({
    ...booking,
    // If a pre-order exists for the booking, we mark it as 'Completed'.
    pre_order_status: preOrderBookingIds.has(booking.id)
      ? 'Completed'
      : 'Not Sent',
  })) || [];


  return <DashboardView bookings={bookingsWithStatus} />;
}
