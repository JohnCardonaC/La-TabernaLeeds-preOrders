"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears, parse } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Calendar as CalendarIcon, Copy, CheckCircle } from 'lucide-react';
import { DateRangePicker, Range } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@/lib/supabase/client';

type Booking = {
  id: string;
  created_at: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
  booking_date: string;
  booking_time: string;
  table_numbers: string;
  number_of_people: number;
  channel: string;
};

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const londonNow = toZonedTime(new Date(), 'Europe/London');
  const [ranges, setRanges] = useState<Range[]>([
    {
      startDate: startOfWeek(londonNow),
      endDate: endOfWeek(londonNow),
      key: 'selection',
    },
  ]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [copiedId, setCopied] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const staticRanges = [
    {
      label: 'This Week',
      range: () => ({
        startDate: startOfWeek(londonNow),
        endDate: endOfWeek(londonNow),
      }),
      isSelected: () => false,
    },
    {
      label: 'Next Week',
      range: () => ({
        startDate: startOfWeek(addWeeks(londonNow, 1)),
        endDate: endOfWeek(addWeeks(londonNow, 1)),
      }),
      isSelected: () => false,
    },
    {
      label: 'This Month',
      range: () => ({
        startDate: startOfMonth(londonNow),
        endDate: endOfMonth(londonNow),
      }),
      isSelected: () => false,
    },
    {
      label: 'Next Month',
      range: () => ({
        startDate: startOfMonth(addMonths(londonNow, 1)),
        endDate: endOfMonth(addMonths(londonNow, 1)),
      }),
      isSelected: () => false,
    },
    {
      label: 'Next 3 Months',
      range: () => ({
        startDate: londonNow,
        endDate: endOfMonth(addMonths(londonNow, 3)),
      }),
      isSelected: () => false,
    },
    {
      label: 'Next 6 Months',
      range: () => ({
        startDate: londonNow,
        endDate: endOfMonth(addMonths(londonNow, 6)),
      }),
      isSelected: () => false,
    },
    {
      label: 'This Year',
      range: () => ({
        startDate: startOfYear(londonNow),
        endDate: endOfYear(londonNow),
      }),
      isSelected: () => false,
    },
    {
      label: 'All time',
      range: () => ({
        startDate: new Date(2024, 0, 1), // January 1, 2024
        endDate: londonNow,
      }),
      isSelected: () => false,
    },
  ];

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const supabase = createClient();

      const query = supabase
        .from('bookings')
        .select(`
          id,
          created_at,
          booking_reference,
          booking_date,
          booking_time,
          table_numbers,
          number_of_people,
          channel,
          customers (
            customer_name,
            customer_email,
            customer_mobile
          )
        `)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
        return;
      }

      let transformedBookings: Booking[] = (data || []).map((booking: any) => ({
        id: booking.id,
        created_at: booking.created_at,
        booking_reference: booking.booking_reference,
        customer_name: booking.customers?.customer_name || 'Unknown',
        customer_email: booking.customers?.customer_email || '',
        customer_mobile: booking.customers?.customer_mobile || '',
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        table_numbers: booking.table_numbers,
        number_of_people: booking.number_of_people,
        channel: booking.channel,
      }));

      // Filter by selected date range if provided
      const selection = ranges[0];
      if (selection.startDate) {
        const start = selection.startDate;
        const end = selection.endDate || start;
        transformedBookings = transformedBookings.filter(booking => {
          const bookingDate = parse(booking.booking_date, 'EEEE, d MMMM yyyy', new Date());
          return bookingDate >= start && bookingDate <= end;
        });
      }

      setBookings(transformedBookings);
      setLoading(false);
    };

    fetchBookings();
  }, [ranges]);

  const handleCopyLink = async (bookingId: string) => {
    try {
      const supabase = createClient();
      const { data: tokenData, error } = await supabase
        .from('access_tokens')
        .select('token')
        .eq('booking_id', bookingId)
        .single();

      if (error || !tokenData) {
        alert('Token not found. Make sure the booking exists and tokens are generated.');
        return;
      }

      const link = `${window.location.origin}/preorder?token=${tokenData.token}`;
      await navigator.clipboard.writeText(link);
      setCopied(bookingId);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      alert('Failed to copy link to clipboard.');
    }
  };

  const handleDateRangeSelect = (item: any) => {
    setRanges(Object.values(item));
  };

  const getRangeLabel = () => {
    const selection = ranges[0];
    if (!selection.startDate) return 'All Bookings';

    const start = selection.startDate;
    const end = selection.endDate || start;

    // Check if it matches any static range
    for (const staticRange of staticRanges) {
      const range = staticRange.range();
      if (range.startDate.getTime() === start.getTime() && range.endDate.getTime() === end.getTime()) {
        return `Bookings of ${staticRange.label}`;
      }
    }

    // Custom range
    return null;
  };

  const rangeLabel = getRangeLabel();

  return (
    <AdminLayout currentPage="bookings">
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-stone-800">
              {rangeLabel || (ranges[0].startDate ? (
                ranges[0].endDate && ranges[0].startDate !== ranges[0].endDate
                  ? `Bookings from ${format(ranges[0].startDate, 'PPP')} to ${format(ranges[0].endDate, 'PPP')}`
                  : `Bookings for ${format(ranges[0].startDate, 'PPP')}`
              ) : 'All Bookings')}
            </h2>
            {rangeLabel && ranges[0].startDate && (
              <p className="text-sm text-stone-600 mt-1">
                ({ranges[0].endDate && ranges[0].startDate !== ranges[0].endDate
                  ? `${format(ranges[0].startDate, 'PPP')} to ${format(ranges[0].endDate, 'PPP')}`
                  : format(ranges[0].startDate, 'PPP')})
              </p>
            )}
          </div>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[280px] justify-start text-left font-normal bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200',
                  !ranges[0].startDate && 'text-stone-500'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {ranges[0].startDate ? (
                  ranges[0].endDate && ranges[0].startDate !== ranges[0].endDate
                    ? `${format(ranges[0].startDate, 'LLL dd')} - ${format(ranges[0].endDate, 'LLL dd')}`
                    : format(ranges[0].startDate, 'PPP')
                ) : <span>Pick a date or range</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
              <div className=" flex flex-wrap gap-2 mb-4">
                {Array.from({ length: 6 }, (_, i) => {
                  const date = addDays(londonNow, i);
                  const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEEE');
                  return (
                    <Button
                      key={i}
                      variant="outline"
                      className="text-xs"
                      size="sm"
                      onClick={() => {
                        setRanges([{ startDate: startOfDay(date), endDate: endOfDay(date), key: 'selection' }]);
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRanges([{ startDate: undefined, endDate: undefined, key: 'selection' }]);
                  }}
                >
                  Clear
                </Button>
              </div>
              <DateRangePicker
                ranges={ranges}
                onChange={handleDateRangeSelect}
                staticRanges={staticRanges}
                inputRanges={[]}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Ref</TableHead>
                <TableHead className="min-w-[200px]">Customer</TableHead>
                <TableHead className="hidden md:table-cell min-w-[120px]">Booking Date</TableHead>
                <TableHead className="hidden md:table-cell min-w-[100px]">Booking Time</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[120px]">Table numbers</TableHead>
                <TableHead className="hidden lg:table-cell text-center min-w-[100px]"># of People</TableHead>
                <TableHead className="hidden xl:table-cell min-w-[100px]">Channel</TableHead>
                <TableHead className="text-center min-w-[120px]">Pre-order link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-stone-500">
                    Loading bookings...
                  </TableCell>
                </TableRow>
              ) : bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.booking_reference}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{booking.customer_name}</div>
                        <div className="text-sm text-gray-600">{booking.customer_email}</div>
                        <div className="text-sm text-gray-600">{booking.customer_mobile}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{booking.booking_date}</TableCell>
                    <TableCell className="hidden md:table-cell">{booking.booking_time}</TableCell>
                    <TableCell className="hidden lg:table-cell">{booking.table_numbers}</TableCell>
                    <TableCell className="hidden lg:table-cell text-center">{booking.number_of_people}</TableCell>
                    <TableCell className="hidden xl:table-cell">{booking.channel}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() => handleCopyLink(booking.id)}
                        variant="outline"
                        className="p-2 border-stone-200 hover:bg-stone-50"
                        title="Copy share link"
                      >
                        {copiedId === booking.id ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-stone-500">
                    No bookings found for this date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}