"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Booking {
  id: string;
  booking_reference: string;
  booking_date: string;
  booking_time: string;
  number_of_people: number;
  customer_name: string;
  customer_email: string;
  customer_mobile: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  photo_url: string | null;
}

function PreOrderContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderMode, setOrderMode] = useState<'individual' | 'group' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      const supabase = createClient();

      // First, validate the token
      const { data: tokenData, error: tokenError } = await supabase
        .from('access_tokens')
        .select(`
          booking_id,
          expires_at,
          used,
          bookings (
            id,
            booking_reference,
            booking_date,
            booking_time,
            number_of_people,
            customers (
              customer_name,
              customer_email,
              customer_mobile
            )
          )
        `)
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        setError('Invalid or expired access token');
        setLoading(false);
        return;
      }

      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        setError('Access token has expired');
        setLoading(false);
        return;
      }

      // Check if token is used (optional, depending on policy)
      if (tokenData.used) {
        setError('Access token has already been used');
        setLoading(false);
        return;
      }

      // Transform data to match interface
      const bookingData = tokenData.bookings as unknown as {
        id: string;
        booking_reference: string;
        booking_date: string;
        booking_time: string;
        number_of_people: number;
        customers: { customer_name: string; customer_email: string; customer_mobile: string };
      };

      const transformedBooking: Booking = {
        id: bookingData.id,
        booking_reference: bookingData.booking_reference,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        number_of_people: bookingData.number_of_people,
        customer_name: bookingData.customers.customer_name,
        customer_email: bookingData.customers.customer_email,
        customer_mobile: bookingData.customers.customer_mobile,
      };

      setBooking(transformedBooking);
      setCurrentToken(token);
      setLoading(false);
    };

    fetchBooking();
  }, [token]);

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !emailInput.trim()) return;

    setVerifyingEmail(true);
    setEmailError(null);

    // Check if the entered email matches the booking's customer email
    if (emailInput.trim().toLowerCase() === booking.customer_email.toLowerCase()) {
      setEmailVerified(true);
    } else {
      setEmailError('The email does not match the booking email. Please check and try again.');
    }

    setVerifyingEmail(false);
  };

  useEffect(() => {
    if (emailVerified) {
      const fetchMenu = async () => {
        setMenuLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('menus')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching menu:', error);
          setMenuLoading(false);
          return;
        }

        setMenuItems(data || []);
        setMenuLoading(false);
      };

      fetchMenu();
    }
  }, [emailVerified]);

  const groupedMenu = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No booking data</p>
      </div>
    );
  }

  // Show email verification form if not verified yet
  if (!emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verify Access</CardTitle>
            <CardDescription>
              To access your booking details, please enter the email address used to make the reservation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div>
                <Label htmlFor="email">Booking Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={verifyingEmail}
                />
              </div>

              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={verifyingEmail || !emailInput.trim()}
              >
                {verifyingEmail ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    // Check if at least one item is selected
    const selectedItems = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (selectedItems.length === 0) {
      alert('Please select at least one item from the menu.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      // Determine the name for the pre-order
      const preOrderName = orderMode === 'individual' ? orderName : booking.customer_name;

      // Create pre_order record
      const { data: preOrderData, error: preOrderError } = await supabase
        .from('pre_orders')
        .insert({
          booking_id: booking.id,
          customer_notes: customerNotes,
          name: preOrderName,
          order_mode: orderMode
        })
        .select()
        .single();

      if (preOrderError) {
        console.error('Error creating pre-order:', preOrderError);
        alert('Error submitting pre-order. Please try again.');
        setSubmitting(false);
        return;
      }

      // Create pre_order_items for selected items
      const preOrderItems = selectedItems.map(([menuItemId, quantity]) => ({
        attendee_id: null, // For now, not using attendees
        menu_item_id: menuItemId,
        quantity
      }));

      const { error: itemsError } = await supabase
        .from('pre_order_items')
        .insert(preOrderItems);

      if (itemsError) {
        console.error('Error creating pre-order items:', itemsError);
        alert('Error submitting pre-order items. Please try again.');
        setSubmitting(false);
        return;
      }

      // Mark token as used after successful submission
      await supabase
        .from('access_tokens')
        .update({ used: true })
        .eq('token', currentToken);

      // Redirect to thank you page
      window.location.href = '/thank-you';

    } catch (error) {
      console.error('Error submitting pre-order:', error);
      alert('Error submitting pre-order. Please try again.');
      setSubmitting(false);
    }
  };

  // Show mode selection after email verification
  if (orderMode === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>How would you like to place your pre-order?</CardTitle>
            <CardDescription>
              Choose the option that best fits your situation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={() => setOrderMode('group')}
              className="w-full h-20 p-4 text-sm font-medium bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md shadow-sm transition-all duration-200"
              variant="ghost"
            >
              <div className="text-center">
                <div className="text-base font-semibold mb-1">Order for the whole group</div>
                <div className="text-xs text-stone-600 leading-relaxed">
                  One person places the order for everyone
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setOrderMode('individual')}
              className="w-full h-20 p-4 text-sm font-medium hover:opacity-90 text-white border border-stone-300 rounded-md shadow-sm transition-all duration-200"
              style={{ backgroundColor: 'hsl(222.2 47.4% 11.2%)' }}
              variant="ghost"
            >
              <div className="text-center">
                <div className="text-base font-semibold mb-1">Order for myself only</div>
                <div className="text-xs text-white/80 leading-relaxed">
                  Share the link or place your individual order
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show booking details after mode selection
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <Button
            onClick={() => setOrderMode(null)}
            variant="ghost"
            className="text-stone-600 hover:text-stone-800 p-0 h-auto font-normal"
          >
            ← Back to order type selection
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-6">Your Booking Details</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Booking Reference</label>
            <p className="mt-1 text-lg">{booking.booking_reference}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <p className="mt-1 text-lg">{booking.customer_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-lg">{booking.customer_email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Telephone</label>
            <p className="mt-1 text-lg">{booking.customer_mobile}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Booking Date</label>
            <p className="mt-1 text-lg">{booking.booking_date}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Booking Time</label>
            <p className="mt-1 text-lg">{booking.booking_time}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number of People</label>
            <p className="mt-1 text-lg">{booking.number_of_people}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {orderMode === 'individual' && (
            <div className="mt-8">
              <Label htmlFor="orderName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </Label>
              <Input
                id="orderName"
                type="text"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Menu</h2>

            {menuLoading ? (
              <p>Loading menu...</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedMenu).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">{category}</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            {item.price && (
                              <p className="font-medium">${item.price.toFixed(2)}</p>
                            )}
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`quantity-${item.id}`} className="text-sm">Qty:</Label>
                              <Input
                                id={`quantity-${item.id}`}
                                type="number"
                                min="0"
                                value={quantities[item.id] || 0}
                                onChange={(e) => setQuantities(prev => ({
                                  ...prev,
                                  [item.id]: parseInt(e.target.value) || 0
                                }))}
                                className="w-16"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </Label>
            <textarea
              id="notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any special requests or dietary requirements..."
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
            />
          </div>

          <div className="mt-8">
            <Button
              type="submit"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? 'Submitting Pre-Order...' : 'Submit Pre-Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PreOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <PreOrderContent />
    </Suspense>
  );
}
