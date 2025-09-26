"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Copy, CheckCircle } from 'lucide-react';

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
  customer_name: string;
  booking_date: string;
  booking_time: string;
  number_of_people: number;
  pre_order_status: 'Completed' | 'Not Sent';
  shareToken?: string;
};

export default function DashboardView({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedDate = searchParams.get('date');
  // To prevent timezone shifts on client, create date from string as UTC
  const initialDate = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [copiedId, setCopied] = useState<string | null>(null);

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
    <AdminLayout currentPage="dashboard">
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-stone-800 mb-4">Dashboard</h2>
          <p className="text-stone-600">soon ...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
