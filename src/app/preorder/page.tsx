"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});
  const [customerNotes, setCustomerNotes] = useState('');
  const [orderName, setOrderName] = useState('');
  const [orderMode, setOrderMode] = useState<'individual' | 'group' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [bottomSheetOpen, setBottomSheetOpen] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('No access token provided');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      const supabase = createClient();

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

      const now = new Date();
      const expiresAt = new Date(tokenData.expires_at);
      if (now > expiresAt) {
        setError('Access token has expired');
        setLoading(false);
        return;
      }

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareLink(window.location.href);
    }
  }, []);

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !emailInput.trim()) return;

    setVerifyingEmail(true);
    setEmailError(null);

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

  const categoryOrder = ['Starters', 'Vegetables', 'Meat', 'Fish'];
  const categoryDisplayNames: Record<string, string> = {
    'Starters': 'Entrantes',
    'Vegetables': 'Vegetales',
    'Meat': 'Carnes',
    'Fish': 'Pescados',
  };
  const sortedCategories = Object.keys(groupedMenu).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link. Please copy it manually.');
    }
  };

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

  if (!emailVerified) {
    const firstName = booking.customer_name.split(' ')[0];

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8 px-4 space-y-8">
        <div className="text-center space-y-4">
          <Image
            src="https://res.cloudinary.com/dycdigital/image/upload/v1758807509/logo-black_fgjop4.png"
            alt="La Taberna"
            width={120}
            height={120}
            className="mx-auto"
          />
          <h1 className="text-2xl font-semibold text-gray-900">Hi, {firstName}!</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-prose mx-auto">
            To optimise the service for a group like yours, we use this pre-order system. <br />
            <br />
           By confirming your order in advance, we facilitate preparation in the kitchen, reduce waiting time and ensure<strong> that everything goes perfectly on the day of your visit.</strong> Your collaboration makes the difference in personalised attention!
          <br /><br /><span className="italic text-base text-gray-600 mt-2 max-w-prose mx-auto" >Thank you for your understanding and cooperation.</span>
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardDescription>
              To access your booking details, please enter the email address used to make the reservation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailVerification} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-2">Booking Email</Label>
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

    const selectedItems = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (selectedItems.length === 0) {
      alert('Please select at least one item from the menu.');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const preOrderName = orderMode === 'individual' ? orderName : booking.customer_name;

      const { data: preOrderData, error: preOrderError } = await supabase
        .from('pre_orders')
        .insert({
          booking_id: booking.id,
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

      const preOrderItems = selectedItems.map(([menuItemId, quantity]) => ({
        attendee_id: null,
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

      window.location.href = '/thank-you';

    } catch (error) {
      console.error('Error submitting pre-order:', error);
      alert('Error submitting pre-order. Please try again.');
      setSubmitting(false);
    }
  };

  if (orderMode === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:items-center md:justify-center pt-12 md:pt-0 py-8 px-4 space-y-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg">
              How would you like to place your pre-order?
            </CardTitle>
            <CardDescription>
              Choose the option that best fits your situation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setOrderMode('group')}
                className="cursor-pointer h-45 md:h-50  p-4 text-sm font-medium bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-md shadow-sm transition-all duration-200"
                variant="ghost"
              >
                <div className="text-center">
                  <div className="text-base font-semibold mb-1 text-xl">
                    Click here to Group pre-order
                  </div>
                  <div className="mt-4 text-sm text-stone-600 whitespace-normal break-words">
                    You decide and confirm the meals for the entire group.
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => setOrderMode('individual')}
                className="cursor-pointer h-45 md:h-50 p-4 text-sm font-medium hover:opacity-90 text-white border border-stone-300 rounded-md shadow-sm transition-all duration-200"
                style={{ backgroundColor: 'hsl(222.2 47.4% 11.2%)' }}
                variant="ghost"
              >
                <div className="text-center">
                  <div className="text-base font-semibold mb-1 text-xl text-white/100">
                     Click here to Individual order
                  </div>
                  <div className="mt-3 text-sm text-white/90 whitespace-normal break-words font-normal">
                    Enter and select your own meal, then share the link with the
                    other guests so they can do the same. If you've received this
                    link, please place your pre-order through this option.
                  </div>
                </div>
              </Button>
            </div>

            <div className="mt-6 space-y-2">
              <Label
                htmlFor="shareLink"
                className="block text-sm font-medium text-gray-700"
              >
                Pre-order Link to Share
              </Label>
              <div className="flex gap-2">
                <Input
                  id="shareLink"
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="px-4 py-2"
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-30 bg-gray-50 py-8">
      <div className="md:max-w-4xl md:mx-auto px-4">
        <div className={`flex flex-col lg:flex-row gap-6 ${Object.keys(quantities).some(id => (quantities[id] || 0) > 0) ? "lg:justify-center" : "justify-center"}`}>
          <div className="md:max-w-2xl w-full md:flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-4">
                <Button
                  onClick={() => setOrderMode(null)}
                  variant="ghost"
                  className="text-stone-600 hover:text-stone-800 p-0 h-auto font-normal"
                >
                  <span className="text-xl px-2 pb-1 bg-gray-800 text-white rounded-full">←</span> Back to order type selection
                </Button>
              </div>
               <Image
                src="https://res.cloudinary.com/dycdigital/image/upload/v1758807509/logo-black_fgjop4.png"
                alt="La Taberna"
                width={80}
                height={80}
                className="mx-auto"
              />
              <h1 className="text-2xl font-bold my-6">Your Booking Details</h1>
             

              <div className="w-full mb-6 md:rounded-2xl md:shadow md:bg-white border-b pb-6  md:border-b-0">
                <div className="grid grid-cols-2 gap-4 p-0 md:p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Booking Reference</label>
                    <p className="mt-1 text-sm">{booking.booking_reference}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Customer Name</label>
                    <p className="mt-1 text-sm">{booking.customer_name}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm">{booking.customer_email}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Booking Date</label>
                    <p className="mt-1 text-sm">{booking.booking_date}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Booking Time</label>
                    <p className="mt-1 text-sm">{booking.booking_time}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">Number of People</label>
                    <p className="mt-1 text-sm">{booking.number_of_people}</p>
                  </div>
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
                  <div className="w-full bg-gray-900 py-1 px-3 rounded-t-lg mb-1">
                    <h2 className="text-xl font-semibold mb-4 text-white">Menu</h2>
                  </div>    

                  {menuLoading ? (
                    <p>Loading menu...</p>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {sortedCategories.map((category) => {
                        const items = groupedMenu[category];
                        return (
                        <AccordionItem value={category} key={category}>
                          <AccordionTrigger>{categoryDisplayNames[category] || category}</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3">
                              {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                                  <div className="flex-1">
                                    <h4 className="font-medium">{item.name}</h4>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                    )}
                                    {item.price && (
                                      <p className="font-medium mt-1">${item.price.toFixed(2)}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-1 ml-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => setTempQuantities(prev => ({
                                        ...prev,
                                        [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                                      }))}
                                    >
                                      -
                                    </Button>
                                    <span className="w-8 text-center font-medium text-sm">{tempQuantities[item.id] || 0}</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => setTempQuantities(prev => ({
                                        ...prev,
                                        [item.id]: (prev[item.id] || 0) + 1
                                      }))}
                                    >
                                      +
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        const qty = tempQuantities[item.id] || 0;
                                        if (qty > 0) {
                                          setQuantities(prev => ({
                                            ...prev,
                                            [item.id]: (prev[item.id] || 0) + qty
                                          }));
                                          setTempQuantities(prev => ({
                                            ...prev,
                                            [item.id]: 0
                                          }));
                                        }
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="ml-2"
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </div>


              </form>
            </div>
          </div>

          {Object.keys(quantities).some(id => (quantities[id] || 0) > 0) && (
            <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-base font-semibold mb-2">Summary of your selection</h3>
                <div className="space-y-1">
                  {Object.entries(quantities)
                    .filter(([, qty]) => qty > 0)
                    .map(([id, qty]) => {
                      const item = menuItems.find(m => m.id === id);
                      return (
                        <div key={id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div className="flex-1">
                            <p className="font-normal text-xs">{item?.name}</p>
                            {item?.price && (
                              <p className="text-xs text-gray-600">${(item.price * qty).toFixed(2)}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setQuantities(prev => ({
                                ...prev,
                                [id]: Math.max(0, (prev[id] || 0) - 1)
                              }))}
                            >
                              -
                            </Button>
                            <span className="w-4 text-center font-medium text-xs">{qty}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setQuantities(prev => ({
                                ...prev,
                                [id]: (prev[id] || 0) + 1
                              }))}
                            >
                              +
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setQuantities(prev => ({
                                ...prev,
                                [id]: 0
                              }))}
                            >
                              X
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-3">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full text-sm"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting Pre-Order...' : 'Submit Pre-Order'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto lg:hidden">
        <div className="bg-white border-t rounded-t-lg shadow-lg">
          <div
            className="p-3 cursor-pointer bg-gray-100 border-b"
            onClick={() => setBottomSheetOpen(!bottomSheetOpen)}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Order Summary</span>
              <span className="text-2xl px-5 bg-gray-600 text-white rounded-full p-1">{bottomSheetOpen ? '↓' : '↑'}</span>
            </div>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              bottomSheetOpen ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <div className="p-4">
              {Object.keys(quantities).filter(id => quantities[id] > 0).length === 0 ? (
                <div className="text-center text-gray-500 py-4 text-sm">
                  Your order is empty
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {Object.entries(quantities)
                      .filter(([, qty]) => qty > 0)
                      .map(([id, qty]) => {
                        const item = menuItems.find(m => m.id === id);
                        return (
                          <div key={id} className="flex justify-between items-center py-2 border-b">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item?.name}</p>
                              {item?.price && (
                                <p className="text-xs text-gray-600">${(item.price * qty).toFixed(2)}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => setQuantities(prev => ({
                                  ...prev,
                                  [id]: Math.max(0, (prev[id] || 0) - 1)
                                }))}
                              >
                                -
                              </Button>
                              <span className="w-6 text-center text-xs">{qty}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 text-xs"
                                onClick={() => setQuantities(prev => ({
                                  ...prev,
                                  [id]: (prev[id] || 0) + 1
                                }))}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full mt-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Order'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
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
