'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

// Definiremos este tipo con más detalle más adelante.
type Booking = any;

export default function DashboardView({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const supabase = createClient();

  // Por ahora, solo mostraremos las reservas en la consola del navegador.
  console.log({ bookings });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Daily Bookings</h1>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </header>
      <main className="flex-1 p-8">
        <h2 className="text-xl mb-4">Today's Reservations</h2>
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-center text-gray-500">
            {/* Aquí mostraremos la lista de reservas. */}
            Bookings list will be displayed here.
          </p>
        </div>
      </main>
    </div>
  );
}
