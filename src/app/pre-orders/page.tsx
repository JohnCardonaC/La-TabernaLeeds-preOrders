"use client";

import { useState, useEffect } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';

type PreOrderWithBooking = {
  id: string;
  name: string;
  submitted_at: string;
  customer_notes: string | null;
  booking: {
    booking_date: string;
    booking_time: string;
    customer_name: string;
    number_of_people: number;
  };
};

export default function PreOrdersPage() {
  const [preOrders, setPreOrders] = useState<PreOrderWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('pre_orders')
        .select(`
          id,
          name,
          submitted_at,
          customer_notes,
          booking:bookings!booking_id (
            booking_date,
            booking_time,
            customer_name,
            number_of_people
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        setError('Error loading pre-orders.');
        console.error(error);
      } else {
        setPreOrders((data as unknown as PreOrderWithBooking[]) || []);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <AdminLayout currentPage="pre-orders">
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPage="pre-orders">
        <p className="text-red-500">{error}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="pre-orders">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Pre-Orders</h2>
      </div>
      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pre-Order Name</TableHead>
              <TableHead>Booking Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-center">Guests</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preOrders.length > 0 ? (
              preOrders.map((preOrder) => (
                <TableRow key={preOrder.id}>
                  <TableCell className="font-medium">{preOrder.name}</TableCell>
                  <TableCell>{preOrder.booking.booking_date} {preOrder.booking.booking_time.substring(0, 5)}</TableCell>
                  <TableCell>{preOrder.booking.customer_name}</TableCell>
                  <TableCell className="text-center">{preOrder.booking.number_of_people}</TableCell>
                  <TableCell>{new Date(preOrder.submitted_at).toLocaleString()}</TableCell>
                  <TableCell>{preOrder.customer_notes || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  No pre-orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
