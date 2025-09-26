"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears, parse } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Calendar as CalendarIcon, Copy, CheckCircle, Printer } from 'lucide-react';
import { DateRangePicker, Range } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  preorder_url: string;
};

type RawBooking = {
  id: string;
  created_at: string;
  booking_reference: string;
  booking_date: string;
  booking_time: string;
  table_numbers: string;
  number_of_people: number;
  channel: string;
  customers: {
    customer_name: string;
    customer_email: string;
    customer_mobile: string;
  } | null;
};

type PreOrder = {
  id: string;
  booking_id: string;
  name: string;
  submitted_at: string;
  customer_notes: string | null;
  order_mode: string | null;
  attendees: Attendee[];
};

type Attendee = {
  id: string;
  person_name: string;
  pre_order_items: PreOrderItem[];
};

type PreOrderItem = {
  id: string;
  quantity: number;
  menu_item: MenuItem;
};

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
};

type RawPreOrder = {
  id: string;
  booking_id: string;
  name: string;
  submitted_at: string;
  customer_notes: string | null;
  order_mode: string | null;
  attendees: RawAttendee[] | null;
};

type RawAttendee = {
  id: string;
  person_name: string;
  pre_order_items: RawPreOrderItem[] | null;
};

type RawPreOrderItem = {
  id: string;
  quantity: number;
  menu_item: RawMenuItem | null;
};

type RawMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string | null;
};

function BookingsPage() {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [preOrdersData, setPreOrdersData] = useState<PreOrder[]>([]);
  const [loadingPreOrders, setLoadingPreOrders] = useState(false);
  const [hasPreOrders, setHasPreOrders] = useState<Set<string>>(new Set());
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  const [selectedTableSize, setSelectedTableSize] = useState<string>('All');

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
          preorder_url,
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        preorder_url: booking.preorder_url,
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

      // Filter by channel
      if (selectedChannel !== 'All') {
        transformedBookings = transformedBookings.filter(booking => booking.channel === selectedChannel);
      }

      // Filter by table size
      if (selectedTableSize === 'Large') {
        transformedBookings = transformedBookings.filter(booking => booking.number_of_people >= 6);
      } else if (selectedTableSize === 'Small') {
        transformedBookings = transformedBookings.filter(booking => booking.number_of_people < 6);
      }

      setBookings(transformedBookings);
      setLoading(false);

      // Fetch booking IDs that have pre-orders
      const { data: preOrderData } = await supabase
        .from('pre_orders')
        .select('booking_id');

      if (preOrderData) {
        const preOrderSet = new Set(preOrderData.map(p => p.booking_id));
        setHasPreOrders(preOrderSet);
      }
    };

    fetchBookings();
  }, [ranges, selectedChannel, selectedTableSize]);

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

  const handlePrint = () => {
    // Consolidate items
    const itemTotals = new Map<string, { name: string; quantity: number }>();
    preOrdersData.forEach(preOrder => {
      preOrder.attendees.forEach(attendee => {
        attendee.pre_order_items.forEach(item => {
          const key = item.menu_item.id;
          if (itemTotals.has(key)) {
            itemTotals.get(key)!.quantity += item.quantity;
          } else {
            itemTotals.set(key, { name: item.menu_item.name, quantity: item.quantity });
          }
        });
      });
    });

    // Generate POS text
    let posText = `PRE-ORDER FOR BOOKING ${selectedBooking?.booking_reference}\n`;
    posText += `Customer: ${selectedBooking?.customer_name}\n`;
    posText += `Date: ${selectedBooking?.booking_date}\n`;
    posText += `Time: ${selectedBooking?.booking_time}\n`;
    posText += `People: ${selectedBooking?.number_of_people}\n`;
    posText += `Table: ${selectedBooking?.table_numbers}\n\n`;
    posText += 'ITEMS:\n';
    itemTotals.forEach(item => {
      posText += `${item.quantity} x ${item.name}\n`;
    });
    posText += '\n';

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px;">${posText}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const fetchPreOrders = async (bookingId: string) => {
    setLoadingPreOrders(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('pre_orders')
      .select(`
        id,
        booking_id,
        name,
        submitted_at,
        customer_notes,
        order_mode,
        attendees (
          id,
          person_name,
          pre_order_items (
            id,
            quantity,
            menu_item:menus (
              id,
              name,
              description,
              price,
              category
            )
          )
        )
      `)
      .eq('booking_id', bookingId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pre-orders:', error);
      setPreOrdersData([]);
    } else {
      // Transform the data to match our types
      const transformedData: PreOrder[] = (data as RawPreOrder[] || []).map((po: RawPreOrder) => ({
        id: po.id,
        booking_id: po.booking_id,
        name: po.name,
        submitted_at: po.submitted_at,
        customer_notes: po.customer_notes,
        order_mode: po.order_mode,
        attendees: (po.attendees || []).map((a: RawAttendee) => ({
          id: a.id,
          person_name: a.person_name,
          pre_order_items: (a.pre_order_items || [])
            .map((poi: RawPreOrderItem) => ({
              id: poi.id,
              quantity: poi.quantity,
              menu_item: poi.menu_item ? {
                id: poi.menu_item.id,
                name: poi.menu_item.name,
                description: poi.menu_item.description,
                price: parseFloat(poi.menu_item.price),
                category: poi.menu_item.category,
              } : null,
            }))
            .filter((poi) => poi.menu_item !== null) as PreOrderItem[],
        })),
      }));
      setPreOrdersData(transformedData);
    }
    setLoadingPreOrders(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="bg-gray-50 min-h-screen p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-stone-800">
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
        </div>

        {/* Filters Section */}
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-[280px]">
              <label className="block text-sm font-medium text-stone-700 mb-2">Date Range</label>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200',
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
                <PopoverContent className="w-full p-4">
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

            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-stone-700 mb-2">Channel</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                <option value="All">All Channels</option>
                <option value="Dish Cult iOS">Dish Cult iOS</option>
                <option value="Internal">Internal</option>
                <option value="Dish Cult Portal">Dish Cult Portal</option>
                <option value="Página Web">Página Web</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Organic social media">Organic social media</option>
                <option value="TripAdvisor">TripAdvisor</option>
                <option value="Organic Search">Organic Search</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-stone-700 mb-2">Table Size</label>
              <select
                value={selectedTableSize}
                onChange={(e) => setSelectedTableSize(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500"
              >
                <option value="All">All Tables</option>
                <option value="Large">Large Tables (6+ people)</option>
                <option value="Small">Small Tables (less than 6 people)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Counter for mobile */}
        <div className="block md:hidden mb-4">
          <p className="text-sm text-stone-800 font-semibold">
            Showing {bookings.length} bookings
          </p>
        </div>

        <div className="hidden md:block border rounded-lg bg-white overflow-x-auto mt-4">
          <div className="p-4 border-b bg-gray-50">
            <p className="text-sm text-stone-800 font-semibold">
              Showing {bookings.length} bookings
            </p>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px] text-sm">Ref</TableHead>
                <TableHead className="min-w-[200px]">Customer</TableHead>
                <TableHead className="hidden md:table-cell min-w-[120px]">Booking Date</TableHead>
                <TableHead className="hidden md:table-cell min-w-[100px]">Booking Time</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[80px] text-center">
                  Table<br />numbers
                </TableHead>
                <TableHead className="hidden lg:table-cell text-center min-w-[100px]"># of People</TableHead>
                <TableHead className="hidden xl:table-cell min-w-[100px]">Channel</TableHead>
                <TableHead className="text-center min-w-[120px]">Pre-order link</TableHead>
                <TableHead className="text-center min-w-[120px]">View Preorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-stone-500">
                    Loading bookings...
                  </TableCell>
                </TableRow>
              ) : bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.booking_reference}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm md:text-base">{booking.customer_name}</div>
                        <div className="text-xs md:text-sm text-gray-600">{booking.customer_email}</div>
                        <div className="text-xs md:text-sm text-gray-600">{booking.customer_mobile}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(() => {
                        const parts = booking.booking_date.split(' ');
                        return <>{parts[0]} {parts[1]}<br />{parts[2]} {parts[3]}</>;
                      })()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{booking.booking_time}</TableCell>
                    <TableCell className="hidden lg:table-cell text-center">{booking.table_numbers}</TableCell>
                    <TableCell className="hidden lg:table-cell text-center">{booking.number_of_people}</TableCell>
                    <TableCell className="hidden xl:table-cell">{booking.channel}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() => window.open(booking.preorder_url, '_blank')}
                        variant="outline"
                        className="px-2 py-1 text-xs border-stone-200 hover:bg-stone-50"
                        title="Go to preorder page"
                      >
                        Go to preorder link
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsModalOpen(true);
                          fetchPreOrders(booking.id);
                        }}
                        variant="outline"
                        className={`px-2 py-1 text-xs border-stone-200 hover:bg-stone-50 ${hasPreOrders.has(booking.id) ? 'bg-[#def8e6]' : ''}`}
                        title="View preorder"
                      >
                        View Preorder
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-stone-500">
                    No bookings found for this date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-4">
          {loading ? (
            <p className="text-center text-stone-500">Loading bookings...</p>
          ) : bookings && bookings.length > 0 ? (
            bookings.map((booking) => (
              <Card key={booking.id} className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">{booking.booking_reference}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div><strong>Customer:</strong> {booking.customer_name}</div>
                    <div><strong>Email:</strong> {booking.customer_email}</div>
                    <div><strong>Mobile:</strong> {booking.customer_mobile}</div>
                    <div><strong>Date:</strong> {booking.booking_date}</div>
                    <div><strong>Time:</strong> {booking.booking_time}</div>
                    <div><strong>Table:</strong> {booking.table_numbers}</div>
                    <div><strong>People:</strong> {booking.number_of_people}</div>
                    <div><strong>Channel:</strong> {booking.channel}</div>
                    <div className="flex flex-col gap-1 mt-4">
                      <Button
                        onClick={() => window.open(booking.preorder_url, '_blank')}
                        variant="outline"
                        size="sm"
                        title="Go to preorder page"
                      >
                        Go to preorder link
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsModalOpen(true);
                          fetchPreOrders(booking.id);
                        }}
                        variant="outline"
                        size="sm"
                        className={`px-2 py-1 text-xs border-stone-200 hover:bg-stone-50 ${hasPreOrders.has(booking.id) ? 'bg-[#def8e6]' : ''}`}
                        title="View preorder"
                      >
                        View Preorder
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-stone-500">No bookings found for this date.</p>
          )}
        </div>
      </div>

      {/* Preorder Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-full md:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <DialogTitle className="text-lg md:text-xl">
                  Preorders for Booking {selectedBooking?.booking_reference}
                </DialogTitle>
                <DialogDescription>
                  View the preorders submitted for this booking.
                </DialogDescription>
              </div>
              <Button onClick={handlePrint} variant="outline" size="sm" className="self-start md:self-auto" title="Print consolidated orders">
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-6">
            {loadingPreOrders ? (
              <p className="text-center text-stone-500">Loading preorders...</p>
            ) : preOrdersData.length === 0 ? (
              <p className="text-center text-stone-500">
                The customer has not yet made their preorder.
              </p>
            ) : (
              preOrdersData.map((preOrder) => {
                const allItems = preOrder.attendees.flatMap(attendee => attendee.pre_order_items);
                return (
                  <div key={preOrder.id} className="mb-4">
                    <h3 className="font-semibold">{preOrder.name}</h3>
                    <p className="text-xs text-stone-600">
                      {format(new Date(preOrder.submitted_at), 'PPP p')}
                    </p>
                    {preOrder.customer_notes && (
                      <p className="text-xs text-stone-600 mt-1">
                        Notes: {preOrder.customer_notes}
                      </p>
                    )}
                    <div className="mt-2">
                      <ul className="text-sm space-y-1">
                        {allItems.map((item) => (
                          <li key={item.id}>
                            {item.quantity} x {item.menu_item.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

export default function BookingsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingsPage />
    </Suspense>
  );
}