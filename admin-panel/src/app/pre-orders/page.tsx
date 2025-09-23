"use client";

import { useState, useEffect } from 'react';
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
        setPreOrders(data || []);
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
              <Link href="/pre-orders" className="text-gray-600 hover:text-gray-800 font-medium">
                Pre-Orders
              </Link>
            </nav>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </header>
        <main className="flex-1 p-8">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  if (error) {
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
              <Link href="/pre-orders" className="text-gray-600 hover:text-gray-800 font-medium">
                Pre-Orders
              </Link>
            </nav>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </header>
        <main className="flex-1 p-8">
          <p className="text-red-500">{error}</p>
        </main>
      </div>
    );
  }

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
            <Link href="/pre-orders" className="text-gray-600 hover:text-gray-800 font-medium">
              Pre-Orders
            </Link>
          </nav>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </header>
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Pre-Orders</h2>
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
      </main>
    </div>
  );
}
