"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

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
import { createClient } from '@/lib/supabase/client';

type Booking = {
  id: string;
  created_at: string;
  customer_name: string;
  booking_date: string;
  booking_time: string;
  number_of_people: number;
  pre_order_status: 'Completed' | 'Not Sent';
};

export default function DashboardView({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const selectedDate = searchParams.get('date');
  // To prevent timezone shifts on client, create date from string as UTC
  const initialDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleDateSelect = (selectedDay: Date | undefined) => {
    setDate(selectedDay);
    setIsPopoverOpen(false); // Close the popover on selection
    if (selectedDay) {
      router.push(`/?date=${format(selectedDay, 'yyyy-MM-dd')}`);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <nav className="flex space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-800 font-medium">
              Dashboard
            </Link>
            <Link href="/menu" className="text-gray-600 hover:text-gray-800 font-medium">
              Menu
            </Link>
          </nav>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </header>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">
            Reservations for{' '}
            <span className="text-blue-600">{date ? format(date, 'PPP') : 'Today'}</span>
          </h2>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[280px] justify-start text-left font-normal bg-white',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="border rounded-lg bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Guests</TableHead>
                <TableHead className="text-center w-[180px]">Pre-Order Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.booking_time.substring(0, 5)}</TableCell>
                    <TableCell>{booking.customer_name}</TableCell>
                    <TableCell className="text-center">{booking.number_of_people}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'px-3 py-1 text-xs font-semibold rounded-full',
                          booking.pre_order_status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-200 text-gray-800'
                        )}
                      >
                        {booking.pre_order_status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                    No bookings found for this date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
